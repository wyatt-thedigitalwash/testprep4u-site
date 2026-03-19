import type { Metadata } from "next";
import { faqPage } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { FaqHero } from "@/components/sections/FaqHero";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { BottomCta } from "@/components/sections/BottomCta";

export const metadata: Metadata = {
  title: faqPage.meta.title,
  description: faqPage.meta.description,
  openGraph: {
    title: faqPage.meta.title,
    description: faqPage.meta.description,
    url: `${SITE.url}/faq`,
  },
  alternates: {
    canonical: `${SITE.url}/faq`,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "FAQ",
      item: `${SITE.url}/faq`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqPage.items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function FaqPageRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FaqHero />
      <FaqAccordion />
      <BottomCta
        headline="Ready to Start Your Insurance Career?"
        body="Join thousands of students who chose the smarter way to prepare. State-approved courses, AI-powered practice exams, and 24/7 support."
        cta="Start Learning Now"
      />
    </>
  );
}
