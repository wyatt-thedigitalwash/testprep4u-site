"use client";

import { useState } from "react";
import { Check, ArrowUpRight, Loader2, Tag } from "lucide-react";
import {
  DiscountCodeField,
  getDiscountedPrice,
  type AppliedDiscount,
} from "@/components/ui/DiscountCodeField";

export interface UpgradeOption {
  tier: string;
  tierLabel: string;
  currentTierLabel: string;
  tagline: string;
  newFeatures: string[];
  currentPrice: number;
  targetPrice: number;
  priceDifference: number;
  additionalMonths: number;
  newExpiresAt: string;
}

interface UpgradeSectionProps {
  courseType: string;
  enrollmentId: string;
  options: UpgradeOption[];
}

export function UpgradeSection({
  courseType,
  enrollmentId,
  options,
}: UpgradeSectionProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [appliedDiscount, setAppliedDiscount] =
    useState<AppliedDiscount | null>(null);

  async function handleUpgrade(targetTier: string) {
    setLoadingTier(targetTier);
    setError("");

    try {
      const body: Record<string, string> = {
        targetTier,
        courseType,
        enrollmentId,
      };
      if (appliedDiscount) {
        body.discountCode = appliedDiscount.code;
      }

      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setLoadingTier(null);
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      setError("Network error. Please try again.");
      setLoadingTier(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Discount code field */}
      <DiscountCodeField
        appliedDiscount={appliedDiscount}
        onApply={setAppliedDiscount}
        onClear={() => setAppliedDiscount(null)}
      />

      {options.map((opt) => {
        const discountedDiff = appliedDiscount
          ? getDiscountedPrice(opt.priceDifference, appliedDiscount)
          : null;
        const displayPrice =
          discountedDiff !== null ? discountedDiff : opt.priceDifference;
        const hasDiscount =
          discountedDiff !== null && discountedDiff < opt.priceDifference;

        return (
          <div
            key={opt.tier}
            className="rounded-xl border border-gray-200 p-5 transition-colors hover:border-blue-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-base font-bold text-navy">
                    {opt.tierLabel}
                  </h4>
                  <span className="text-xs text-gray-400">{opt.tagline}</span>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {opt.newFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check
                        size={14}
                        className="mt-0.5 flex-shrink-0 text-success"
                      />
                      {f}
                    </li>
                  ))}
                  {opt.additionalMonths > 0 && (
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <Check
                        size={14}
                        className="mt-0.5 flex-shrink-0 text-success"
                      />
                      +{opt.additionalMonths} months access (expires{" "}
                      {new Date(opt.newExpiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      )
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  {hasDiscount ? (
                    <>
                      <p className="font-display text-2xl font-bold text-navy">
                        ${displayPrice}
                      </p>
                      <p className="text-sm text-gray-400 line-through">
                        ${opt.priceDifference}
                      </p>
                    </>
                  ) : (
                    <p className="font-display text-2xl font-bold text-navy">
                      ${opt.priceDifference}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {opt.tierLabel} (${opt.targetPrice}) &minus;{" "}
                  {opt.currentTierLabel} (${opt.currentPrice})
                </p>
                {hasDiscount && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-success">
                    <Tag size={10} />
                    {appliedDiscount!.discountType === "percentage"
                      ? `${appliedDiscount!.discountValue}% off`
                      : `$${appliedDiscount!.discountValue} off`}
                  </p>
                )}
                <button
                  onClick={() => handleUpgrade(opt.tier)}
                  disabled={!!loadingTier}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
                >
                  {loadingTier === opt.tier ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay ${displayPrice} to upgrade
                      <ArrowUpRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {error && (
        <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}
    </div>
  );
}
