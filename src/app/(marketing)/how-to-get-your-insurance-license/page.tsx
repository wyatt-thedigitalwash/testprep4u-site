import type { Metadata } from "next";
import { processPage } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { ProcessHero } from "@/components/sections/ProcessHero";
import { ProcessSteps } from "@/components/sections/ProcessSteps";
import { BottomCta } from "@/components/sections/BottomCta";

export const metadata: Metadata = {
  title: processPage.meta.title,
  description: processPage.meta.description,
  openGraph: {
    title: processPage.meta.title,
    description: processPage.meta.description,
    url: `${SITE.url}/how-to-get-your-insurance-license`,
  },
  alternates: {
    canonical: `${SITE.url}/how-to-get-your-insurance-license`,
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
      name: "How to Get Your Insurance License",
      item: `${SITE.url}/how-to-get-your-insurance-license`,
    },
  ],
};

export default function HowToGetLicensedPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProcessHero />
      <ProcessSteps />
      <BottomCta
        headline="Ready to Start Your Insurance Career?"
        body="Join thousands of students who chose the smarter way to prepare. State-approved courses, AI-powered practice exams, and 24/7 support."
        cta="Start Learning Now"
      />
    </>
  );
}
