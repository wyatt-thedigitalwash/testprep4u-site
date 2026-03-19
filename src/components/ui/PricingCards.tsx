"use client";

import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import {
  PRICING_TIERS,
  COURSE_TYPE_LABELS,
  type CourseType,
  type PricingTier,
} from "@/lib/pricing";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";

interface PricingCardsProps {
  courseType?: CourseType;
  showToggle?: boolean;
}

export function PricingCards({
  courseType: initialType = "life",
  showToggle = true,
}: PricingCardsProps) {
  const [courseType, setCourseType] = useState<CourseType>(initialType);
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
}

function TierCard({ tier, courseType, isInView, delay }: TierCardProps) {
  const price = tier.prices[courseType];
  const isHighlighted = tier.highlighted;

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
        <Button
          variant="primary"
          href="/pricing"
          className="w-full text-center"
        >
          Get Started
        </Button>
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
