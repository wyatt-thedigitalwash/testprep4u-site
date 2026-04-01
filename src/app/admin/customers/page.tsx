import { CustomersTable } from "@/components/admin/CustomersTable";

export default function AdminCustomersPage() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Customers
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Customer enrollments, revenue, and referral tracking.
        </p>
      </div>
      <CustomersTable />
    </div>
  );
}
