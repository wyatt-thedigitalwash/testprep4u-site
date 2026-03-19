import type { Metadata } from "next";
import { pricingPage } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { PRICING_TIERS } from "@/lib/pricing";
import { PricingHero } from "@/components/sections/PricingHero";
import { PricingCards } from "@/components/ui/PricingCards";
import { TeamCallout } from "@/components/sections/TeamCallout";
import { Guarantee } from "@/components/sections/Guarantee";
import { PricingFaq } from "@/components/sections/PricingFaq";
import { BottomCta } from "@/components/sections/BottomCta";

export const metadata: Metadata = {
  title: pricingPage.meta.title,
  description: pricingPage.meta.description,
  openGraph: {
    title: pricingPage.meta.title,
    description: pricingPage.meta.description,
    url: `${SITE.url}/pricing`,
  },
  alternates: {
    canonical: `${SITE.url}/pricing`,
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
      name: "Pricing",
      item: `${SITE.url}/pricing`,
    },
  ],
};

const productJsonLd = PRICING_TIERS.map((tier) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: `TestPrep4U ${tier.name}`,
  description: tier.tagline,
  brand: {
    "@type": "Brand",
    name: "TestPrep4U",
  },
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: tier.prices.life || undefined,
    availability: "https://schema.org/InStock",
  },
}));

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {productJsonLd.map((product, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
        />
      ))}
      <PricingHero />
      <PricingCards />
      <TeamCallout />
      <Guarantee />
      <PricingFaq />
      <BottomCta />
    </>
  );
}
