"use client";

import { useState } from "react";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import type { DiscountValidationResult } from "@/app/api/discount/validate/route";

export interface AppliedDiscount {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
}

export function DiscountCodeField({
  appliedDiscount,
  onApply,
  onClear,
}: {
  appliedDiscount: AppliedDiscount | null;
  onApply: (discount: AppliedDiscount) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    if (!code.trim()) return;
    setValidating(true);
    setError("");

    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data: DiscountValidationResult = await res.json();

      if (data.valid && data.discountType && data.discountValue && data.code) {
        onApply({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
        });
        setExpanded(false);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setValidating(false);
    }
  }

  if (appliedDiscount) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-light px-4 py-2.5">
        <CheckCircle2 size={16} className="flex-shrink-0 text-success" />
        <span className="flex-1 text-sm font-semibold text-success">
          Code applied: {appliedDiscount.code} &mdash;{" "}
          {appliedDiscount.discountType === "percentage"
            ? `${appliedDiscount.discountValue}% off`
            : `$${appliedDiscount.discountValue} off`}
        </span>
        <button
          onClick={() => {
            onClear();
            setCode("");
            setError("");
          }}
          className="text-xs font-medium text-success/70 transition-colors hover:text-success"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
        >
          <Tag size={14} />
          Have a discount code?
          <ChevronDown size={14} />
        </button>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
              placeholder="Enter discount code"
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium uppercase tracking-wider text-navy placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleApply}
              disabled={validating || !code.trim()}
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 ease-out hover:bg-blue-600 disabled:opacity-50"
            >
              {validating ? "Checking..." : "Apply"}
            </button>
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={12} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Calculate a discounted price */
export function getDiscountedPrice(
  price: number,
  discount: AppliedDiscount | null
): number | null {
  if (!discount || price === 0) return null;
  if (discount.discountType === "percentage") {
    return Math.round(price * (1 - discount.discountValue / 100) * 100) / 100;
  }
  return Math.max(0, Math.round((price - discount.discountValue) * 100) / 100);
}
