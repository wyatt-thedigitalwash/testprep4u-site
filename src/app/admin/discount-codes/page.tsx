import { createAdminClient } from "@/lib/supabase/server";
import {
  DiscountCodesManager,
  type DiscountCodeData,
} from "@/components/admin/DiscountCodesManager";

export default async function AdminDiscountCodesPage() {
  const supabase = createAdminClient();

  const { data: codes } = await supabase
    .from("discount_codes")
    .select(
      "id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, is_active, created_at"
    )
    .order("created_at", { ascending: false });

  // Fetch redemptions for all codes
  const codeIds = (codes || []).map((c) => c.id);
  let redemptionsMap = new Map<string, DiscountCodeData["redemptions"]>();

  if (codeIds.length > 0) {
    const { data: redemptions } = await supabase
      .from("discount_code_redemptions")
      .select(
        "id, discount_code_id, user_id, stripe_checkout_session_id, amount_discounted, created_at"
      )
      .in("discount_code_id", codeIds)
      .order("created_at", { ascending: false });

    // Get user names/emails for redemptions
    const userIds = [
      ...new Set((redemptions || []).map((r) => r.user_id)),
    ];

    let nameMap = new Map<string, string>();
    let emailMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      for (const p of profiles || []) {
        nameMap.set(p.id, p.full_name || "");
      }

      const {
        data: { users: authUsers },
      } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

      for (const u of authUsers || []) {
        if (u.email) emailMap.set(u.id, u.email);
      }
    }

    for (const r of redemptions || []) {
      const list = redemptionsMap.get(r.discount_code_id) || [];
      list.push({
        id: r.id,
        user_name: nameMap.get(r.user_id) || "",
        user_email: emailMap.get(r.user_id) || "",
        amount_discounted: r.amount_discounted,
        stripe_checkout_session_id: r.stripe_checkout_session_id,
        created_at: r.created_at,
      });
      redemptionsMap.set(r.discount_code_id, list);
    }
  }

  const codeData: DiscountCodeData[] = (codes || []).map((code) => ({
    ...code,
    redemptions: redemptionsMap.get(code.id) || [],
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <DiscountCodesManager codes={codeData} />
    </div>
  );
}
