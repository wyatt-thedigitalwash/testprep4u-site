import { Settings } from "lucide-react";
import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AdminUsersSection,
  DataExportSection,
  BackfillSection,
  type AdminUser,
} from "@/components/admin/AdminSettingsManager";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const userClient = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await userClient.auth.getUser();

  // Fetch all admin profiles
  const { data: adminProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_admin", true);

  // Get emails from auth
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  const emailMap = new Map<string, string>();
  for (const u of authUsers || []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  const admins: AdminUser[] = (adminProfiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name || "",
    email: emailMap.get(p.id) || "",
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Admin access and platform configuration.
        </p>
      </div>

      {/* Admin Users */}
      <AdminUsersSection
        admins={admins}
        currentUserId={currentUser?.id || ""}
      />

      {/* Data Export */}
      <DataExportSection />

      {/* Revenue Backfill */}
      <BackfillSection />

      {/* Platform Settings placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
            <Settings size={20} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-gray-900">
              Platform Settings
            </h3>
            <p className="text-xs text-gray-400">
              Support email, site name, pass thresholds, and email templates.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Support Email
              </p>
              <p className="text-xs text-gray-400">
                Displayed on support pages and in email footers.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
              Coming Soon
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Site Name</p>
              <p className="text-xs text-gray-400">
                Used in page titles and email subjects.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-400">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
