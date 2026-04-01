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

export interface ReferralRow {
  payout_id: string;
  partner_secondary_key: number;
  partner_name: string;
  partner_primary_key: number;
  customer_primary_key: number;
  customer_name: string;
  redemption_date: string;
  gross_amount: number | null;
  discount_amount: number | null;
  tax_amount: number | null;
  fee_amount: number | null;
  net_amount: number | null;
  commission_amount: number;
  gross_profit: number;
  paid_status: string;
  paid_date: string | null;
  payor_name: string | null;
  manager_approval_name: string | null;
}

/**
 * GET /api/admin/referrals
 * Query params: sk, pk, status, from, to, sort, dir, page, limit, format
 */
export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sk = searchParams.get("sk") || "";
  const pk = searchParams.get("pk") || "";
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const sort = searchParams.get("sort") || "redemption_date";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const format = searchParams.get("format");

  const supabase = createAdminClient();

  // Replicate admin_secondary_key_view joins via direct queries
  const { data: payouts } = await supabase
    .from("commission_payouts")
    .select(
      "id, affiliate_id, redemption_id, commission_amount, gross_profit, status, approved_by, approved_at, paid_by, paid_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (!payouts || payouts.length === 0) {
    return NextResponse.json({ rows: [], total: 0, stats: emptyStats() });
  }

  // Get affiliates
  const affiliateIds = [...new Set(payouts.map((p) => p.affiliate_id))];
  const { data: affiliates } = await supabase
    .from("affiliates")
    .select("id, user_id")
    .in("id", affiliateIds);

  const affUserIds = (affiliates || []).map((a) => a.user_id);
  const affIdToUserId = new Map((affiliates || []).map((a) => [a.id, a.user_id]));

  // Get partner profiles
  const { data: partnerProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, primary_key, secondary_key")
    .in("id", affUserIds);

  const partnerMap = new Map(
    (partnerProfiles || []).map((p) => [p.id, p])
  );

  // Get redemptions
  const redemptionIds = [...new Set(payouts.map((p) => p.redemption_id))];
  const { data: redemptions } = await supabase
    .from("discount_code_redemptions")
    .select("id, user_id, stripe_checkout_session_id, created_at")
    .in("id", redemptionIds);

  const redemptionMap = new Map(
    (redemptions || []).map((r) => [r.id, r])
  );

  // Get customer profiles
  const customerUserIds = [...new Set((redemptions || []).map((r) => r.user_id))];
  const { data: customerProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, primary_key")
    .in("id", customerUserIds);

  const customerMap = new Map(
    (customerProfiles || []).map((p) => [p.id, p])
  );

  // Get enrollments by stripe_session_id for revenue fields
  const sessionIds = (redemptions || [])
    .map((r) => r.stripe_checkout_session_id)
    .filter(Boolean);

  let enrollmentMap = new Map<
    string,
    {
      gross_amount: number | null;
      discount_amount: number | null;
      tax_amount: number | null;
      fee_amount: number | null;
      net_amount: number | null;
    }
  >();

  if (sessionIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select(
        "stripe_session_id, gross_amount, discount_amount, tax_amount, fee_amount, net_amount"
      )
      .in("stripe_session_id", sessionIds);

    for (const e of enrollments || []) {
      if (e.stripe_session_id) {
        enrollmentMap.set(e.stripe_session_id, {
          gross_amount: e.gross_amount,
          discount_amount: e.discount_amount,
          tax_amount: e.tax_amount,
          fee_amount: e.fee_amount,
          net_amount: e.net_amount,
        });
      }
    }
  }

  // Assemble rows
  let rows: ReferralRow[] = payouts.map((cp) => {
    const affUserId = affIdToUserId.get(cp.affiliate_id);
    const partner = affUserId ? partnerMap.get(affUserId) : null;
    const redemption = redemptionMap.get(cp.redemption_id);
    const customer = redemption ? customerMap.get(redemption.user_id) : null;
    const enrollment = redemption
      ? enrollmentMap.get(redemption.stripe_checkout_session_id) || null
      : null;

    return {
      payout_id: cp.id,
      partner_secondary_key: partner?.secondary_key ?? 0,
      partner_name: partner?.full_name || "—",
      partner_primary_key: partner?.primary_key ?? 0,
      customer_primary_key: customer?.primary_key ?? 0,
      customer_name: customer?.full_name || "—",
      redemption_date: redemption?.created_at || cp.created_at,
      gross_amount: enrollment?.gross_amount ?? null,
      discount_amount: enrollment?.discount_amount ?? null,
      tax_amount: enrollment?.tax_amount ?? null,
      fee_amount: enrollment?.fee_amount ?? null,
      net_amount: enrollment?.net_amount ?? null,
      commission_amount: cp.commission_amount,
      gross_profit: cp.gross_profit,
      paid_status: cp.status,
      paid_date: cp.paid_at,
      payor_name: cp.paid_by,
      manager_approval_name: cp.approved_by,
    };
  });

  // Apply filters
  if (sk) {
    rows = rows.filter((r) => String(r.partner_secondary_key).includes(sk));
  }
  if (pk) {
    rows = rows.filter((r) => String(r.customer_primary_key).includes(pk));
  }
  if (status) {
    rows = rows.filter((r) => r.paid_status === status);
  }
  if (from) {
    const fromDate = new Date(from);
    rows = rows.filter((r) => new Date(r.redemption_date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to + "T23:59:59");
    rows = rows.filter((r) => new Date(r.redemption_date) <= toDate);
  }

  // Stats on filtered data
  const stats = {
    totalReferrals: rows.length,
    pendingCommission: rows
      .filter((r) => r.paid_status !== "paid")
      .reduce((s, r) => s + r.commission_amount, 0),
    paidCommission: rows
      .filter((r) => r.paid_status === "paid")
      .reduce((s, r) => s + r.commission_amount, 0),
    totalGrossProfit: rows.reduce((s, r) => s + r.gross_profit, 0),
  };

  // Sort
  const SORTABLE: Record<string, (r: ReferralRow) => string | number> = {
    partner_secondary_key: (r) => r.partner_secondary_key,
    partner_name: (r) => r.partner_name.toLowerCase(),
    customer_primary_key: (r) => r.customer_primary_key,
    customer_name: (r) => r.customer_name.toLowerCase(),
    redemption_date: (r) => r.redemption_date,
    gross_amount: (r) => r.gross_amount ?? 0,
    net_amount: (r) => r.net_amount ?? 0,
    commission_amount: (r) => r.commission_amount,
    gross_profit: (r) => r.gross_profit,
    paid_status: (r) => r.paid_status,
  };

  const sortFn = SORTABLE[sort] || SORTABLE.redemption_date;
  rows.sort((a, b) => {
    const va = sortFn(a);
    const vb = sortFn(b);
    if (va < vb) return dir === "asc" ? -1 : 1;
    if (va > vb) return dir === "asc" ? 1 : -1;
    return 0;
  });

  // Export
  if (format === "csv" || format === "xlsx") {
    return buildExport(rows);
  }

  // Paginate
  const total = rows.length;
  const offset = (page - 1) * limit;
  const paged = rows.slice(offset, offset + limit);

  return NextResponse.json({ rows: paged, total, stats });
}

/**
 * PATCH /api/admin/referrals — update payout status
 * Body: { payoutId, action: 'approve' | 'mark_paid', name }
 */
export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { payoutId, action, name } = await request.json();

  if (!payoutId || !action) {
    return NextResponse.json({ error: "Missing payoutId or action" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (action === "approve") {
    const { error } = await supabase
      .from("commission_payouts")
      .update({
        status: "approved",
        approved_by: name || "Admin",
        approved_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Payout approved." });
  }

  if (action === "mark_paid") {
    const { error } = await supabase
      .from("commission_payouts")
      .update({
        status: "paid",
        paid_by: name || "Admin",
        paid_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Payout marked as paid." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/* ── Helpers ───────────────────────────────────────────────── */

function emptyStats() {
  return { totalReferrals: 0, pendingCommission: 0, paidCommission: 0, totalGrossProfit: 0 };
}

function fmtCurrency(v: number | null): string {
  if (v === null || v === undefined) return "";
  return v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function buildExport(rows: ReferralRow[]) {
  const headers = [
    "Secondary Key", "Partner Name", "Partner PK", "Customer PK", "Customer Name",
    "Date", "Gross Revenue", "Discount", "Tax", "Fees", "Net Revenue",
    "Commission", "Gross Profit", "Paid", "Paid Date", "Payor Name", "Manager Approval",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        String(r.partner_secondary_key),
        csvEscape(r.partner_name),
        String(r.partner_primary_key),
        String(r.customer_primary_key),
        csvEscape(r.customer_name),
        fmtDate(r.redemption_date),
        fmtCurrency(r.gross_amount),
        fmtCurrency(r.discount_amount),
        fmtCurrency(r.tax_amount),
        fmtCurrency(r.fee_amount),
        fmtCurrency(r.net_amount),
        fmtCurrency(-r.commission_amount),
        fmtCurrency(r.gross_profit),
        r.paid_status === "paid" ? "Yes" : "No",
        fmtDate(r.paid_date),
        csvEscape(r.payor_name || ""),
        csvEscape(r.manager_approval_name || ""),
      ].join(",")
    ),
  ];

  return new Response(csvRows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="referrals-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
