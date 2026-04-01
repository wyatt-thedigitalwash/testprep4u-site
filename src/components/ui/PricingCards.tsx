"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Sparkles, Tag } from "lucide-react";
import {
  PRICING_TIERS,
  COURSE_TYPE_LABELS,
  COURSE_FULL_NAMES,
  type CourseType,
  type PricingTier,
} from "@/lib/pricing";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import {
  DiscountCodeField,
  getDiscountedPrice,
  type AppliedDiscount,
} from "@/components/ui/DiscountCodeField";

const VALID_COURSE_TYPES: CourseType[] = ["life", "health", "combined"];

interface PricingCardsProps {
  courseType?: CourseType;
  showToggle?: boolean;
}

export function PricingCards(props: PricingCardsProps) {
  return (
    <Suspense>
      <PricingCardsInner {...props} />
    </Suspense>
  );
}

function PricingCardsInner({
  courseType: initialType = "life",
  showToggle = true,
}: PricingCardsProps) {
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course") as CourseType | null;
  const planParam = searchParams.get("plan");
  const autoCheckout = searchParams.get("autoCheckout") === "true";

  // Use URL course param if valid, otherwise fall back to prop
  const resolvedInitial =
    courseParam && VALID_COURSE_TYPES.includes(courseParam)
      ? courseParam
      : initialType;

  const [courseType, setCourseType] = useState<CourseType>(resolvedInitial);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  // Show full-screen loading when auto-checkout is triggered
  const discountParam = searchParams.get("discount") || "";
  if (autoCheckout && planParam) {
    return <AutoCheckoutLoader planParam={planParam} courseType={resolvedInitial} discountCode={discountParam} />;
  }

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Course type toggle */}
        {showToggle && (
          <div
            className="mb-16 flex justify-center"
            style={fadeUp(isInView, 0)}
          >
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {(Object.keys(COURSE_TYPE_LABELS) as CourseType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setCourseType(key)}
                  className={`cursor-pointer rounded-md px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    courseType === key
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-navy"
                  }`}
                >
                  {COURSE_TYPE_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Discount code field */}
        <div style={fadeUp(isInView, 50)}>
          <DiscountCodeField
            appliedDiscount={appliedDiscount}
            onApply={setAppliedDiscount}
            onClear={() => setAppliedDiscount(null)}
          />
        </div>

        {/* Tier cards */}
        <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <TierCard
              key={tier.slug}
              tier={tier}
              courseType={courseType}
              isInView={isInView}
              delay={150 + i * 100}
              autoCheckout={false}
              appliedDiscount={appliedDiscount}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Auto-checkout loading screen ---------- */

function AutoCheckoutLoader({
  planParam,
  courseType,
  discountCode,
}: {
  planParam: string;
  courseType: CourseType;
  discountCode: string;
}) {
  const router = useRouter();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // Clear any stale localStorage fallback
    try { localStorage.removeItem("pendingCheckout"); } catch {}

    (async () => {
      try {
        // Check for existing enrollment first
        const enrollCheck = await fetch("/api/user/has-enrollments");
        if (enrollCheck.ok) {
          const enrollData = await enrollCheck.json();
          if (enrollData.hasEnrollments) {
            router.push("/dashboard");
            return;
          }
        }

        const checkoutBody: Record<string, string> = { tier: planParam, courseType };
        if (discountCode) checkoutBody.discountCode = discountCode;

        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkoutBody),
        });

        if (!res.ok) {
          // Fall back to showing pricing page on error
          const url = new URL(window.location.href);
          url.searchParams.delete("autoCheckout");
          window.history.replaceState({}, "", url.toString());
          window.location.reload();
          return;
        }

        const data = await res.json();
        if (data.url) {
          const url = new URL(window.location.href);
          url.searchParams.delete("autoCheckout");
          window.history.replaceState({}, "", url.toString());
          window.location.href = data.url;
        } else {
          // Fall back to showing pricing page
          const url = new URL(window.location.href);
          url.searchParams.delete("autoCheckout");
          window.history.replaceState({}, "", url.toString());
          window.location.reload();
        }
      } catch {
        const url = new URL(window.location.href);
        url.searchParams.delete("autoCheckout");
        window.history.replaceState({}, "", url.toString());
        window.location.reload();
      }
    })();
  }, [planParam, courseType, router]);

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        <h2 className="font-display text-2xl font-bold text-navy">
          Welcome to TestPrep4U!
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Redirecting you to checkout...
        </p>
      </div>
    </section>
  );
}

/* ---------- Individual tier card ---------- */

interface TierCardProps {
  tier: PricingTier;
  courseType: CourseType;
  isInView: boolean;
  delay: number;
  autoCheckout?: boolean;
  appliedDiscount: AppliedDiscount | null;
}

function TierCard({ tier, courseType, isInView, delay, autoCheckout, appliedDiscount }: TierCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const autoCheckoutFired = useRef(false);
  const price = tier.prices[courseType];
  const isHighlighted = tier.highlighted;

  const discountedPrice = getDiscountedPrice(price, appliedDiscount);
  const hasDiscount = discountedPrice !== null && discountedPrice < price;

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      // Check for existing enrollment before initiating checkout
      const enrollCheck = await fetch("/api/user/has-enrollments");
      if (enrollCheck.ok) {
        const enrollData = await enrollCheck.json();
        if (enrollData.hasEnrollments) {
          // Already enrolled — redirect to dashboard instead of double-charging
          router.push("/dashboard");
          return;
        }
      }

      const body: Record<string, string> = { tier: tier.slug, courseType };
      if (appliedDiscount) {
        body.discountCode = appliedDiscount.code;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Not logged in — redirect to signup with plan + discount context
          localStorage.setItem(
            "pendingCheckout",
            JSON.stringify({ plan: tier.slug, course: courseType, discount: appliedDiscount?.code || "" })
          );
          const discountParam = appliedDiscount ? `&discount=${encodeURIComponent(appliedDiscount.code)}` : "";
          router.push(`/signup?plan=${tier.slug}&course=${courseType}${discountParam}`);
          setLoading(false);
          return;
        }
        const errData = await res.json().catch(() => null);
        setError(errData?.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.url) {
        // Clear autoCheckout from URL to prevent re-trigger on back navigation
        const url = new URL(window.location.href);
        url.searchParams.delete("autoCheckout");
        window.history.replaceState({}, "", url.toString());
        window.location.href = data.url;
      } else {
        setError("Failed to create checkout session. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [tier.slug, courseType, router, appliedDiscount]);

  // Auto-checkout on mount when URL params indicate returning from auth
  useEffect(() => {
    if (autoCheckout && !autoCheckoutFired.current && price > 0) {
      autoCheckoutFired.current = true;
      // Clear any stale localStorage fallback since URL params took over
      try { localStorage.removeItem("pendingCheckout"); } catch {}
      handleCheckout();
    }
  }, [autoCheckout, price, handleCheckout]);

  return (
    <div
      className={`relative flex flex-col rounded-xl p-8 transition-shadow duration-200 ${
        isHighlighted
          ? "z-10 border-2 border-blue-500 bg-blue-100/30 shadow-lg md:scale-105"
          : "border border-gray-200 bg-white shadow-sm hover:shadow-md"
      }`}
      style={fadeUp(isInView, delay)}
    >
      {/* Recommended badge */}
      {isHighlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
            <Sparkles size={12} />
            Recommended
          </span>
        </div>
      )}

      {/* Header */}
      <div className={isHighlighted ? "pt-2" : ""}>
        <h3 className="text-xl font-bold text-navy">
          {tier.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {tier.tagline}
        </p>
      </div>

      {/* Price */}
      <div className="mt-6">
        {price > 0 ? (
          <div>
            <div className="flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <span className="text-4xl font-extrabold text-navy">
                    ${discountedPrice}
                  </span>
                  <span className="text-xl font-bold text-gray-400 line-through">
                    ${price}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-extrabold text-navy">
                  ${price}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
                <Tag size={10} />
                {appliedDiscount!.discountType === "percentage"
                  ? `${appliedDiscount!.discountValue}% off`
                  : `$${appliedDiscount!.discountValue} off`}
              </p>
            )}
          </div>
        ) : (
          <span className="text-4xl font-extrabold text-navy">
            $TBD
          </span>
        )}
        <p className="mt-1 text-sm text-gray-400">
          {COURSE_FULL_NAMES[courseType]} &middot; {tier.accessMonths}-month access
        </p>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-gray-200" />

      {/* Features */}
      <ul className="flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-3">
            {feature.included ? (
              <Check
                size={16}
                className="mt-0.5 flex-shrink-0 text-blue-500"
              />
            ) : (
              <X
                size={16}
                className="mt-0.5 flex-shrink-0 text-gray-300"
              />
            )}
            <span
              className={`text-sm ${
                feature.included ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {feature.label}
              {feature.comingSoon && (
                <span className="ml-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Coming Soon
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-lg bg-error-light px-4 py-3 text-xs text-error">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="mt-8">
        <button
          onClick={() => { setError(""); handleCheckout(); }}
          disabled={loading || price === 0}
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-8 py-3.5 font-body font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
        >
          {loading ? "Redirecting..." : "Get Started"}
        </button>
      </div>

      {/* Guarantee badge */}
      {tier.hasGuarantee && (
        <p className="mt-4 text-center text-xs font-medium text-gray-400">
          Includes first-time pass guarantee
        </p>
      )}
    </div>
  );
}
