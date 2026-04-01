import { ReferralsTable } from "@/components/admin/ReferralsTable";

export default function AdminReferralsPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Referrals
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Affiliate commissions, payout tracking, and referral analytics.
        </p>
      </div>
      <ReferralsTable />
    </div>
  );
}
