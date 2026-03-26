"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Sparkles } from "lucide-react";
import {
  PRICING_TIERS,
  COURSE_TYPE_LABELS,
  type CourseType,
  type PricingTier,
} from "@/lib/pricing";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

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
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Course type toggle */}
        {showToggle && (
          <div
            className="mb-12 flex justify-center"
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

        {/* Tier cards */}
        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <TierCard
              key={tier.slug}
              tier={tier}
              courseType={courseType}
              isInView={isInView}
              delay={150 + i * 100}
              autoCheckout={autoCheckout && tier.slug === planParam}
            />
          ))}
        </div>
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
}

function TierCard({ tier, courseType, isInView, delay, autoCheckout }: TierCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const autoCheckoutFired = useRef(false);
  const price = tier.prices[courseType];
  const isHighlighted = tier.highlighted;

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.slug, courseType }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        // Not logged in — redirect to signup with plan context
        localStorage.setItem(
          "pendingCheckout",
          JSON.stringify({ plan: tier.slug, course: courseType })
        );
        router.push(`/signup?plan=${tier.slug}&course=${courseType}`);
      } else {
        console.error("Checkout error:", data.error);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, [tier.slug, courseType, router]);

  // Auto-checkout on mount when URL params indicate returning from auth
  useEffect(() => {
    if (autoCheckout && !autoCheckoutFired.current && price > 0) {
      autoCheckoutFired.current = true;
      handleCheckout();
    }
  }, [autoCheckout, price, handleCheckout]);

  // localStorage fallback: if user lands on /pricing with pendingCheckout
  // but no URL params, redirect to self with params
  useEffect(() => {
    if (autoCheckoutFired.current) return;
    try {
      const stored = localStorage.getItem("pendingCheckout");
      if (!stored) return;
      const { plan, course } = JSON.parse(stored);
      if (plan === tier.slug && course === courseType) {
        localStorage.removeItem("pendingCheckout");
        autoCheckoutFired.current = true;
        handleCheckout();
      }
    } catch {
      // Ignore parse errors
    }
  }, [tier.slug, courseType, handleCheckout]);

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
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-navy">
              ${price}
            </span>
          </div>
        ) : (
          <span className="text-4xl font-extrabold text-navy">
            $TBD
          </span>
        )}
        <p className="mt-1 text-sm text-gray-400">
          {tier.accessMonths}-month access
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

      {/* CTA */}
      <div className="mt-8">
        <button
          onClick={handleCheckout}
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
