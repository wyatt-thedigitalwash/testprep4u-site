"use client";

import { useInView } from "@/hooks/useInView";
import { slideLeft } from "@/lib/animations";

interface MetricItem {
  value: string;
  label: string;
  source?: string;
  tone: "warning" | "success" | "brand";
}

interface MetricStripProps {
  items: readonly MetricItem[];
}

export function MetricStrip({ items }: MetricStripProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <section className="bg-navy pb-12 pt-2 md:pb-14">
      <div
        ref={ref}
        className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`border-l-4 border-blue-500 pl-5 ${
                i > 0 ? "md:ml-8" : ""
              }`}
              style={slideLeft(isInView, i * 200)}
            >
              <p className="font-display text-3xl font-extrabold text-white md:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-300">
                {item.label}
              </p>
              {item.source && (
                <p className="mt-0.5 text-xs text-gray-400">{item.source}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
