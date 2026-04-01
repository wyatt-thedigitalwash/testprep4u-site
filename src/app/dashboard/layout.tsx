import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, plan_tier, is_admin")
    .eq("id", user.id)
    .single();

  const userName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  const userTier = profile?.plan_tier || "essentials";
  const isAdmin = profile?.is_admin === true;

  return (
    <DashboardShell userName={userName} userTier={userTier} isAdmin={isAdmin}>
      {children}
    </DashboardShell>
  );
}
