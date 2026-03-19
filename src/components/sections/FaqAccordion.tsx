"use client";

import { useState, useMemo } from "react";
import { faqPage } from "@/lib/content";
import { AccordionItem } from "@/components/ui/AccordionItem";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Search } from "lucide-react";

// Derive ordered categories from the data
const CATEGORIES = Array.from(
  new Set(faqPage.items.map((item) => item.category)),
);

export function FaqAccordion() {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  const toggle = (key: string) =>
    setOpenIndex((prev) => (prev === key ? null : key));

  // Filter items by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return faqPage.items;
    const q = query.toLowerCase();
    return faqPage.items.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q),
    );
  }, [query]);

  // Group filtered items by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const cat of CATEGORIES) {
      const items = filtered.filter((item) => item.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filtered]);

  return (
    <section className="py-20 md:py-24">
      <div ref={ref} className="mx-auto max-w-3xl px-6 md:px-10 lg:px-16">
        {/* Search bar */}
        <div className="relative" style={fadeUp(isInView, 0)}>
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-lg border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm text-gray-700 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Category groups */}
        <div className="mt-10 space-y-12" style={fadeUp(isInView, 150)}>
          {grouped.size === 0 && (
            <p className="text-center text-sm text-gray-500">
              No questions match &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          )}

          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              {/* Category heading */}
              <h2 className="mb-4 text-lg font-bold text-navy">
                {category}
              </h2>

              {/* Accordion items */}
              <div className="flex flex-col gap-2.5">
                {items.map((item) => {
                  const key = `${category}-${item.question}`;
                  return (
                    <AccordionItem
                      key={key}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openIndex === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
