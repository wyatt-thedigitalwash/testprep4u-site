import Link from "next/link";
import {
  CreditCard,
  HelpCircle,
  ArrowUpRight,
  CheckCircle,
  Check,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserEnrollments } from "@/lib/course-data";
import { PRICING_TIERS } from "@/lib/pricing";
import type { PricingTier } from "@/lib/pricing";
import {
  UpgradeSection,
  type UpgradeOption,
} from "@/components/dashboard/UpgradeSection";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";

const TIER_ORDER = ["essentials", "pro", "premium"] as const;

/** Compute features in `target` that are NOT included in `current` */
function getNewFeatures(
  currentTier: PricingTier,
  targetTier: PricingTier
): string[] {
  const currentIncluded = new Set(
    currentTier.features.filter((f) => f.included).map((f) => f.label)
  );
  return targetTier.features
    .filter((f) => f.included && !currentIncluded.has(f.label))
    .map((f) => f.label + (f.comingSoon ? " (Coming Soon)" : ""));
}

/** Clamp month overflow when adding months to a date */
function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  if (result.getMonth() !== targetMonth % 12) {
    result.setDate(0);
  }
  return result;
}

export default async function SettingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const upgradeSuccess = searchParams.upgrade === "success";

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const enrollments = await getUserEnrollments();

  // Fetch profile data (includes phone which isn't in user_metadata)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, state")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
  const email = user.email || "";
  const phone = profile?.phone || "";
  const state = profile?.state || user.user_metadata?.state || "FL";

  // Use the highest tier enrollment for display
  const tierPriority = { premium: 3, pro: 2, essentials: 1 };
  const primaryEnrollment = enrollments.sort(
    (a, b) =>
      (tierPriority[b.tier as keyof typeof tierPriority] || 0) -
      (tierPriority[a.tier as keyof typeof tierPriority] || 0)
  )[0];

  const tier = primaryEnrollment?.tier || "essentials";
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  // Look up current tier data
  const currentTierData = PRICING_TIERS.find((t) => t.slug === tier);
  const currentFeatures = currentTierData
    ? currentTierData.features
        .filter((f) => f.included)
        .map((f) => f.label + (f.comingSoon ? " (Coming Soon)" : ""))
    : [];

  // Build upgrade options
  const upgradeOptions: UpgradeOption[] = [];
  if (primaryEnrollment && currentTierData) {
    const currentIndex = TIER_ORDER.indexOf(tier as (typeof TIER_ORDER)[number]);
    const courseType = primaryEnrollment.courseType as
      | "life"
      | "health"
      | "combined";

    const currentPrice =
      currentTierData.prices[courseType] || currentTierData.prices.life;

    for (let i = currentIndex + 1; i < TIER_ORDER.length; i++) {
      const targetSlug = TIER_ORDER[i];
      const targetTierData = PRICING_TIERS.find((t) => t.slug === targetSlug);
      if (!targetTierData) continue;

      const targetPrice =
        targetTierData.prices[courseType] || targetTierData.prices.life;
      const priceDifference = targetPrice - currentPrice;

      // Skip if no positive price difference
      if (priceDifference <= 0) continue;

      const newFeatures = getNewFeatures(currentTierData, targetTierData);
      const additionalMonths =
        targetTierData.accessMonths - currentTierData.accessMonths;

      // New expiration = current expires_at + additional months
      const currentExpires = new Date(primaryEnrollment.expiresAt);
      const newExpires = addMonthsClamped(currentExpires, additionalMonths);

      upgradeOptions.push({
        tier: targetSlug,
        tierLabel:
          targetSlug.charAt(0).toUpperCase() + targetSlug.slice(1),
        currentTierLabel: tierLabel,
        tagline: targetTierData.tagline,
        newFeatures,
        currentPrice,
        targetPrice,
        priceDifference,
        additionalMonths,
        newExpiresAt: newExpires.toISOString(),
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Upgrade success banner */}
      {upgradeSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success-light p-4">
          <CheckCircle size={20} className="flex-shrink-0 text-success" />
          <p className="text-sm font-medium text-success">
            Your plan has been upgraded successfully! Your new features and
            extended access are now active.
          </p>
        </div>
      )}

      {/* Profile */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ProfileEditor
          fullName={fullName}
          email={email}
          phone={phone}
          state={state}
        />
      </div>

      {/* Subscription */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-light">
            <CreditCard size={20} className="text-success" />
          </div>
          <h3 className="font-display text-lg font-semibold text-navy">
            Subscription
          </h3>
        </div>

        {primaryEnrollment ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-sm font-semibold text-blue-500">
                {tierLabel} Plan
              </span>
              <span className="rounded-full bg-success-light px-3 py-0.5 text-xs font-semibold text-success">
                Active
              </span>
            </div>

            <dl className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Enrolled</dt>
                <dd className="font-medium text-navy">
                  {new Date(primaryEnrollment.enrolledAt).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Access Expires</dt>
                <dd className="font-medium text-navy">
                  {new Date(primaryEnrollment.expiresAt).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  )}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="mb-4 text-sm text-gray-500">
            No active subscription. Enroll in a course to get started.
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Included Features
          </p>
          <ul className="space-y-1.5">
            {currentFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <Check
                  size={14}
                  className="mt-0.5 flex-shrink-0 text-blue-500"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Upgrade Plan */}
      {primaryEnrollment && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <ArrowUpRight size={20} className="text-blue-500" />
            </div>
            <h3 className="font-display text-lg font-semibold text-navy">
              Upgrade Plan
            </h3>
          </div>

          {upgradeOptions.length === 0 ? (
            <p className="text-sm text-gray-500">
              You&apos;re on the highest plan. You have access to all features
              and the longest access period.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-500">
                Unlock additional features and extend your access period.
              </p>
              <UpgradeSection
                courseType={primaryEnrollment.courseType}
                enrollmentId={primaryEnrollment.enrollmentId}
                options={upgradeOptions}
              />
            </>
          )}
        </div>
      )}

      {/* Support */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-light">
            <HelpCircle size={20} className="text-warning" />
          </div>
          <h3 className="font-display text-lg font-semibold text-navy">
            Support
          </h3>
        </div>

        <p className="mb-4 text-sm text-gray-500">
          Need help? Our support team is available 24/7.
        </p>

        <Link
          href="/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border-2 border-blue-500 px-5 py-2 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
