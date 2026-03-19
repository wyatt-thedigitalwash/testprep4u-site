"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { aboutPage } from "@/lib/content";
import { fadeUp } from "@/lib/animations";
import { ChevronRight } from "lucide-react";

export function AboutHero() {
  const { headline, body } = aboutPage.intro;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <section className="bg-navy py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-blue-100/60"
          style={fadeUp(mounted, 0)}
        >
          <Link
            href="/"
            className="transition-colors hover:text-blue-100"
          >
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="text-blue-100">About</span>
        </nav>

        {/* Headline */}
        <h1
          className="mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl lg:leading-[1.05]"
          style={fadeUp(mounted, 100)}
        >
          {headline}
        </h1>

        {/* Body */}
        <p
          className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-100 md:text-xl"
          style={fadeUp(mounted, 200)}
        >
          {body}
        </p>
      </div>
    </section>
  );
}
