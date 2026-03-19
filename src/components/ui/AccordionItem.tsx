"use client";

import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: AccordionItemProps) {
  return (
    <div
      className={`relative cursor-pointer rounded-lg border transition-all duration-300 ${
        isOpen
          ? "border-blue-200 bg-blue-100/20"
          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
      }`}
    >
      {/* Trigger */}
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-4 py-4.5 pl-5 pr-4 text-left"
      >
        <span
          className={`flex-1 font-display text-[15px] font-bold transition-colors duration-300 ${
            isOpen ? "text-blue-500" : "text-navy"
          }`}
        >
          {question}
        </span>

        {/* Icon */}
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-all duration-300 ${
            isOpen ? "bg-blue-500 shadow-sm" : "bg-gray-100"
          }`}
        >
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ease-out ${
              isOpen ? "rotate-180 text-white" : "text-gray-500"
            }`}
          />
        </span>
      </button>

      {/* Answer — always in DOM for SEO, visually collapsed via CSS */}
      <div className={`faq-answer ${isOpen ? "open" : ""}`}>
        <div>
          <p className="pb-5 pl-5 pr-12 font-body text-sm leading-relaxed text-gray-600">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
