import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminClient,
} from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return profile?.is_admin ? user : null;
}

export interface CustomerRow {
  primary_key: number;
  secondary_key: number;
  customer_name: string;
  billing_street: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip: string | null;
  phone: string | null;
  email: string;
  course_name: string | null;
  course_state: string | null;
  plan_tier: string | null;
  referral_code: number | null;
  enrolled_at: string | null;
  gross_amount: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  fee_amount: number | null;
  net_amount: number | null;
}

/**
 * GET /api/admin/customers
 * Query params: pk, sk, course, state, tier, from, to, sort, dir, page, limit, format
 */
export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pk = searchParams.get("pk") || "";
  const sk = searchParams.get("sk") || "";
  const course = searchParams.get("course") || "";
  const state = searchParams.get("state") || "";
  const tier = searchParams.get("tier") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const sort = searchParams.get("sort") || "primary_key";
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const format = searchParams.get("format"); // "csv" or "xlsx" or null (JSON)

  const supabase = createAdminClient();

  // Build the same join as admin_primary_key_view but via direct queries
  // (the view uses auth.users which supabase-js can't query via .from())

  // 1. Get all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, primary_key, secondary_key, full_name, billing_street, billing_city, billing_state, billing_zip, phone, plan_tier"
    )
    .eq("is_admin", false);

  if (!profiles) {
    return NextResponse.json({ rows: [], total: 0, stats: emptyStats() });
  }

  // 2. Get emails from auth
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailMap = new Map<string, string>();
  for (const u of authUsers || []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  // 3. Get enrollments with course info
  const userIds = profiles.map((p) => p.id);
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, user_id, course_id, enrolled_at, stripe_session_id, gross_amount, discount_amount, tax_amount, fee_amount, net_amount, courses ( name, state )"
    )
    .in("user_id", userIds);

  // 4. Get referral codes: redemption → discount_code → affiliate → profile.secondary_key
  const sessionIds = (enrollments || [])
    .filter((e) => e.stripe_session_id)
    .map((e) => e.stripe_session_id!);

  let referralMap = new Map<string, number>(); // stripe_session_id → referrer secondary_key
  if (sessionIds.length > 0) {
    const { data: redemptions } = await supabase
      .from("discount_code_redemptions")
      .select("stripe_checkout_session_id, discount_code_id")
      .in("stripe_checkout_session_id", sessionIds);

    if (redemptions && redemptions.length > 0) {
      const codeIds = [...new Set(redemptions.map((r) => r.discount_code_id))];
      const { data: codes } = await supabase
        .from("discount_codes")
        .select("id, affiliate_id")
        .in("id", codeIds)
        .not("affiliate_id", "is", null);

      if (codes && codes.length > 0) {
        const affiliateIds = [...new Set(codes.map((c) => c.affiliate_id!))];
        const { data: affiliates } = await supabase
          .from("affiliates")
          .select("id, user_id")
          .in("id", affiliateIds);

        const affUserIds = (affiliates || []).map((a) => a.user_id);
        const { data: affProfiles } = await supabase
          .from("profiles")
          .select("id, secondary_key")
          .in("id", affUserIds);

        // Build lookup chain
        const affIdToUserId = new Map(
          (affiliates || []).map((a) => [a.id, a.user_id])
        );
        const userIdToSecKey = new Map(
          (affProfiles || []).map((p) => [p.id, p.secondary_key])
        );
        const codeIdToAffId = new Map(
          (codes || []).map((c) => [c.id, c.affiliate_id!])
        );
        const redemptionSessionToCodeId = new Map(
          (redemptions || []).map((r) => [
            r.stripe_checkout_session_id,
            r.discount_code_id,
          ])
        );

        for (const [sessId, codeId] of redemptionSessionToCodeId) {
          const affId = codeIdToAffId.get(codeId);
          if (!affId) continue;
          const affUserId = affIdToUserId.get(affId);
          if (!affUserId) continue;
          const secKey = userIdToSecKey.get(affUserId);
          if (secKey != null) referralMap.set(sessId, secKey);
        }
      }
    }
  }

  // 5. Build enrollment map (user_id → enrollments[])
  const enrollmentsByUser = new Map<
    string,
    typeof enrollments
  >();
  for (const e of enrollments || []) {
    const list = enrollmentsByUser.get(e.user_id) || [];
    list.push(e);
    enrollmentsByUser.set(e.user_id, list);
  }

  // 6. Assemble rows (one per enrollment, or one per profile if no enrollment)
  let rows: CustomerRow[] = [];
  for (const p of profiles) {
    const userEnrollments = enrollmentsByUser.get(p.id);
    const email = emailMap.get(p.id) || "";

    if (userEnrollments && userEnrollments.length > 0) {
      for (const e of userEnrollments) {
        const c = e.courses as unknown as { name: string; state: string } | null;
        rows.push({
          primary_key: p.primary_key,
          secondary_key: p.secondary_key,
          customer_name: p.full_name || "",
          billing_street: p.billing_street,
          billing_city: p.billing_city,
          billing_state: p.billing_state,
          billing_zip: p.billing_zip,
          phone: p.phone,
          email,
          course_name: c?.name || null,
          course_state: c?.state || null,
          plan_tier: p.plan_tier,
          referral_code: e.stripe_session_id
            ? referralMap.get(e.stripe_session_id) ?? null
            : null,
          enrolled_at: e.enrolled_at,
          gross_amount: e.gross_amount,
          discount_amount: e.discount_amount,
          tax_amount: e.tax_amount,
          fee_amount: e.fee_amount,
          net_amount: e.net_amount,
        });
      }
    } else {
      rows.push({
        primary_key: p.primary_key,
        secondary_key: p.secondary_key,
        customer_name: p.full_name || "",
        billing_street: p.billing_street,
        billing_city: p.billing_city,
        billing_state: p.billing_state,
        billing_zip: p.billing_zip,
        phone: p.phone,
        email,
        course_name: null,
        course_state: null,
        plan_tier: p.plan_tier,
        referral_code: null,
        enrolled_at: null,
        gross_amount: null,
        discount_amount: null,
        tax_amount: null,
        fee_amount: null,
        net_amount: null,
      });
    }
  }

  // 7. Apply filters
  if (pk) {
    rows = rows.filter((r) => String(r.primary_key).includes(pk));
  }
  if (sk) {
    rows = rows.filter((r) => String(r.referral_code) === sk || String(r.secondary_key) === sk);
  }
  if (course) {
    rows = rows.filter(
      (r) => r.course_name?.toLowerCase().includes(course.toLowerCase())
    );
  }
  if (state) {
    rows = rows.filter((r) => r.course_state === state);
  }
  if (tier) {
    rows = rows.filter((r) => r.plan_tier === tier);
  }
  if (from) {
    const fromDate = new Date(from);
    rows = rows.filter(
      (r) => r.enrolled_at && new Date(r.enrolled_at) >= fromDate
    );
  }
  if (to) {
    const toDate = new Date(to + "T23:59:59");
    rows = rows.filter(
      (r) => r.enrolled_at && new Date(r.enrolled_at) <= toDate
    );
  }

  // 8. Compute stats on filtered rows
  const stats = {
    totalCustomers: new Set(rows.map((r) => r.primary_key)).size,
    totalGross: rows.reduce((s, r) => s + (r.gross_amount || 0), 0),
    totalNet: rows.reduce((s, r) => s + (r.net_amount || 0), 0),
    totalDiscount: rows.reduce((s, r) => s + (r.discount_amount || 0), 0),
  };

  // 9. Sort
  const SORTABLE: Record<string, (r: CustomerRow) => string | number | null> = {
    primary_key: (r) => r.primary_key,
    secondary_key: (r) => r.secondary_key,
    customer_name: (r) => r.customer_name.toLowerCase(),
    email: (r) => r.email.toLowerCase(),
    course_name: (r) => r.course_name || "",
    course_state: (r) => r.course_state || "",
    plan_tier: (r) => r.plan_tier || "",
    enrolled_at: (r) => r.enrolled_at || "",
    gross_amount: (r) => r.gross_amount ?? 0,
    net_amount: (r) => r.net_amount ?? 0,
    referral_code: (r) => r.referral_code ?? 0,
  };

  const sortFn = SORTABLE[sort] || SORTABLE.primary_key;
  rows.sort((a, b) => {
    const va = sortFn(a);
    const vb = sortFn(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  // 10. Export formats
  if (format === "csv" || format === "xlsx") {
    return buildExport(rows, format);
  }

  // 11. Paginate for JSON response
  const total = rows.length;
  const offset = (page - 1) * limit;
  const paged = rows.slice(offset, offset + limit);

  return NextResponse.json({ rows: paged, total, stats });
}

function emptyStats() {
  return { totalCustomers: 0, totalGross: 0, totalNet: 0, totalDiscount: 0 };
}

function fmtCurrency(v: number | null): string {
  if (v === null || v === undefined) return "";
  return v < 0
    ? `-$${Math.abs(v).toFixed(2)}`
    : `$${v.toFixed(2)}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADERS = [
  "Primary Key",
  "Secondary Key",
  "Customer Name",
  "Billing Street",
  "City",
  "State",
  "Zip",
  "Phone",
  "Email",
  "Course",
  "Course State",
  "Program",
  "Referral Code",
  "Date",
  "Gross Revenue",
  "Discount",
  "Tax",
  "Fees",
  "Net Revenue",
];

function rowToCsvFields(r: CustomerRow): string[] {
  return [
    String(r.primary_key),
    String(r.secondary_key),
    csvEscape(r.customer_name),
    csvEscape(r.billing_street || ""),
    csvEscape(r.billing_city || ""),
    r.billing_state || "",
    r.billing_zip || "",
    r.phone || "",
    csvEscape(r.email),
    csvEscape(r.course_name || ""),
    r.course_state || "",
    r.plan_tier || "",
    r.referral_code != null ? String(r.referral_code) : "",
    fmtDate(r.enrolled_at),
    fmtCurrency(r.gross_amount),
    fmtCurrency(r.discount_amount),
    fmtCurrency(r.tax_amount),
    fmtCurrency(r.fee_amount),
    fmtCurrency(r.net_amount),
  ];
}

function buildExport(rows: CustomerRow[], format: string) {
  // Both CSV and XLSX use CSV format for now — XLSX requires a library.
  // For true .xlsx, add `xlsx` package in a future iteration.
  const csvRows = [
    CSV_HEADERS.join(","),
    ...rows.map((r) => rowToCsvFields(r).join(",")),
  ];
  const csv = csvRows.join("\n");
  const ext = format === "xlsx" ? "csv" : "csv"; // TODO: real xlsx with `xlsx` package
  const filename = `customers-${new Date().toISOString().split("T")[0]}.${ext}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
