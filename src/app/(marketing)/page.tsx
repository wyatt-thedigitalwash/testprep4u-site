import type { Metadata } from "next";
import { homePage } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { Hero } from "@/components/sections/Hero";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { StepsOverview } from "@/components/sections/StepsOverview";
import { Guarantee } from "@/components/sections/Guarantee";
import { QuickFacts } from "@/components/sections/QuickFacts";
import { FaqPreview } from "@/components/sections/FaqPreview";
import { BottomCta } from "@/components/sections/BottomCta";

export const metadata: Metadata = {
  title: homePage.meta.title,
  description: homePage.meta.description,
  openGraph: {
    title: homePage.meta.title,
    description: homePage.meta.description,
    url: SITE.url,
  },
  alternates: {
    canonical: SITE.url,
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <StepsOverview />
      <Guarantee />
      <QuickFacts />
      <FaqPreview />
      <BottomCta />
    </>
  );
}
