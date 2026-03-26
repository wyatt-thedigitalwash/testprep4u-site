import Link from "next/link";
import { User, CreditCard, HelpCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserEnrollments } from "@/lib/course-data";

const tierFeatures: Record<string, string[]> = {
  essentials: [
    "Pre-licensing course content (state-approved)",
    "Chapter quizzes",
    "3 full practice exams",
    "Progress tracking dashboard",
    "Completion certificate",
    "24/7 chat support",
    "6-month access",
  ],
  pro: [
    "Pre-licensing course content (state-approved)",
    "Chapter quizzes",
    "Unlimited practice exam retakes",
    "AI-adaptive review (targets weak areas)",
    "Downloadable study guides (PDF)",
    "Digital flashcard decks",
    "Exam readiness predictor",
    "First-time pass guarantee",
    "9-month access",
  ],
  premium: [
    "Pre-licensing course content (state-approved)",
    "Chapter quizzes",
    "Unlimited practice exam retakes",
    "AI-adaptive review (targets weak areas)",
    "Downloadable study guides (PDF)",
    "Digital flashcard decks",
    "Exam readiness predictor",
    "First-time pass guarantee",
    "Video instruction modules",
    "Priority support (email + phone)",
    "Printed study guide shipped to door",
    "12-month access",
  ],
};

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const enrollments = await getUserEnrollments();

  const fullName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
  const email = user.email || "";
  const state = user.user_metadata?.state || "Florida";

  // Use the highest tier enrollment for display
  const tierPriority = { premium: 3, pro: 2, essentials: 1 };
  const primaryEnrollment = enrollments.sort(
    (a, b) =>
      (tierPriority[b.tier as keyof typeof tierPriority] || 0) -
      (tierPriority[a.tier as keyof typeof tierPriority] || 0)
  )[0];

  const tier = primaryEnrollment?.tier || "essentials";
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const features = tierFeatures[tier] || tierFeatures.essentials;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <User size={20} className="text-blue-500" />
          </div>
          <h3 className="font-display text-lg font-semibold text-navy">
            Profile
          </h3>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium text-navy">{fullName}</dd>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-3">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-navy">{email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">State</dt>
            <dd className="font-medium text-navy">{state}</dd>
          </div>
        </dl>
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
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

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
          className="inline-flex items-center justify-center rounded-lg border-2 border-blue-500 px-5 py-2 font-body text-sm font-bold text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
