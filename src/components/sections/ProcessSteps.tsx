"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { processPage } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { useInView } from "@/hooks/useInView";
import { fadeUp } from "@/lib/animations";
import { Check, AlertTriangle, ClipboardList, Eye } from "lucide-react";

export function ProcessSteps() {
  const { steps, congratulations, bottomCta } = processPage;
  const [activeStep, setActiveStep] = useState(1);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  // Track which step is in the viewport for sidebar highlighting
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveStep(i + 1);
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        <div className="flex gap-16 lg:gap-20">
          {/* Sticky sidebar — desktop only */}
          <nav className="hidden w-56 flex-shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Steps
              </p>
              <ul className="space-y-1">
                {steps.map((step) => {
                  const isActive = activeStep === step.number;
                  return (
                    <li key={step.number}>
                      <a
                        href={`#step-${step.number}`}
                        className={`flex items-center gap-3 border-l-2 py-2 pl-4 text-sm transition-all duration-200 ${
                          isActive
                            ? "border-blue-500 font-bold text-blue-500"
                            : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-600"
                        }`}
                      >
                        <span className="font-mono text-xs">
                          0{step.number}
                        </span>
                        {step.tag.charAt(0) + step.tag.slice(1).toLowerCase()}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {steps.map((step, i) => (
              <StepSection
                key={step.number}
                step={step}
                isLast={i === steps.length - 1}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
              />
            ))}

            {/* Congratulations */}
            <CongratsSection
              headline={congratulations.headline}
              body={congratulations.body}
              cta={bottomCta}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Individual step section ---------- */

interface StepData {
  readonly number: number;
  readonly title: string;
  readonly tag: string;
  readonly body: string;
  readonly bullets: readonly string[];
  readonly fullBody: readonly string[];
  readonly callout?: { readonly title: string; readonly body: string };
  readonly whatToBring?: readonly string[];
  readonly whatToExpect?: readonly string[];
}

interface StepSectionProps {
  step: StepData;
  isLast: boolean;
}

import { forwardRef } from "react";

const StepSection = forwardRef<HTMLElement, StepSectionProps>(
  function StepSection({ step, isLast }, ref) {
    const { ref: inViewRef, isInView } = useInView<HTMLDivElement>({
      threshold: 0.05,
    });

    return (
      <article
        id={`step-${step.number}`}
        ref={ref}
        className={`scroll-mt-24 ${!isLast ? "border-b border-gray-200" : ""}`}
      >
        <div
          ref={inViewRef}
          className={`${!isLast ? "pb-16 md:pb-20" : "pb-12"} ${step.number > 1 ? "pt-16 md:pt-20" : ""}`}
        >
          {/* Decorative number + eyebrow */}
          <div style={fadeUp(isInView, 0)}>
            <span className="font-display text-7xl font-extrabold leading-none text-blue-200">
              0{step.number}
            </span>
            <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
              {step.tag}
            </p>
          </div>

          {/* Title */}
          <h2
            className="mt-4 text-2xl font-bold text-navy md:text-3xl"
            style={fadeUp(isInView, 100)}
          >
            {step.title}
          </h2>

          {/* Full body paragraphs */}
          <div
            className="mt-6 space-y-4"
            style={fadeUp(isInView, 200)}
          >
            {step.fullBody.map((paragraph, j) => (
              <p
                key={j}
                className="text-base leading-relaxed text-gray-700"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Bullets */}
          {step.bullets.length > 0 && (
            <ul
              className="mt-6 space-y-3"
              style={fadeUp(isInView, 300)}
            >
              {step.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-3 text-base text-gray-700"
                >
                  <Check
                    size={18}
                    className="mt-0.5 flex-shrink-0 text-blue-500"
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          {/* Callout box (Step 2) */}
          {step.callout && (
            <div
              className="mt-8 rounded-r-lg border-l-4 border-blue-500 bg-blue-100/40 p-6"
              style={fadeUp(isInView, 350)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-blue-500" />
                <h3 className="font-bold text-navy">{step.callout.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {step.callout.body}
              </p>
            </div>
          )}

          {/* What to Bring (Step 4) */}
          {step.whatToBring && (
            <div
              className="mt-8"
              style={fadeUp(isInView, 300)}
            >
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-blue-500" />
                <h3 className="font-bold text-navy">What to Bring</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {step.whatToBring.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-base text-gray-700"
                  >
                    <Check
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-blue-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What to Expect (Step 4) */}
          {step.whatToExpect && (
            <div
              className="mt-8"
              style={fadeUp(isInView, 350)}
            >
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-blue-500" />
                <h3 className="font-bold text-navy">What to Expect</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {step.whatToExpect.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-base text-gray-700"
                  >
                    <Check
                      size={18}
                      className="mt-0.5 flex-shrink-0 text-blue-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Internal links for relevant steps */}
          {step.number === 1 && (
            <div className="mt-8 flex flex-wrap gap-3" style={fadeUp(isInView, 400)}>
              <Button variant="secondary" href="/life-insurance-exam-prep">
                Life Insurance Prep &rarr;
              </Button>
              <Button variant="secondary" href="/health-insurance-exam-prep">
                Health Insurance Prep &rarr;
              </Button>
              <Button variant="secondary" href="/life-and-health-insurance-exam-prep">
                Combined Prep &rarr;
              </Button>
            </div>
          )}

          {step.number === 2 && (
            <div className="mt-8" style={fadeUp(isInView, 400)}>
              <Button variant="primary" href="/pricing">
                View Course Options &rarr;
              </Button>
            </div>
          )}

          {step.number === 3 && (
            <div className="mt-8" style={fadeUp(isInView, 350)}>
              <Button variant="primary" href="/pricing">
                Start Practicing Now &rarr;
              </Button>
            </div>
          )}
        </div>
      </article>
    );
  },
);

/* ---------- Congratulations section ---------- */

interface CongratsSectionProps {
  headline: string;
  body: string;
  cta: string;
}

function CongratsSection({ headline, body, cta }: CongratsSectionProps) {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.15 });

  return (
    <div ref={ref} className="pt-16 md:pt-20">
      <div style={fadeUp(isInView, 0)}>
        <h2 className="text-2xl font-bold text-navy md:text-3xl">
          {headline}
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-gray-500">{body}</p>
      </div>
      <div className="mt-8" style={fadeUp(isInView, 150)}>
        <Button variant="primary" href="/pricing">
          {cta}
        </Button>
      </div>
    </div>
  );
}
