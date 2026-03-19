import type { Metadata } from "next";
import { aboutPage } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { AboutHero } from "@/components/sections/AboutHero";
import { CourseCards } from "@/components/sections/CourseCards";
import { WhyNow } from "@/components/sections/WhyNow";
import { QuickFacts } from "@/components/sections/QuickFacts";
import { BottomCta } from "@/components/sections/BottomCta";

export const metadata: Metadata = {
  title: aboutPage.meta.title,
  description: aboutPage.meta.description,
  openGraph: {
    title: aboutPage.meta.title,
    description: aboutPage.meta.description,
    url: `${SITE.url}/about`,
  },
  alternates: {
    canonical: `${SITE.url}/about`,
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
      name: "About",
      item: `${SITE.url}/about`,
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <AboutHero />
      <CourseCards />
      <WhyNow />
      <QuickFacts />
      <BottomCta />
    </>
  );
}
