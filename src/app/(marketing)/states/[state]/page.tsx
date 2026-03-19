import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/constants";
import { getStateBySlug, getAllStateSlugs } from "@/lib/states";
import { StateHero } from "@/components/sections/StateHero";
import { StateRequirements } from "@/components/sections/StateRequirements";
import { CourseCards } from "@/components/sections/CourseCards";
import { StateQuickFacts } from "@/components/sections/StateQuickFacts";
import { StateFaq } from "@/components/sections/StateFaq";
import { BottomCta } from "@/components/sections/BottomCta";

interface PageProps {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return getAllStateSlugs().map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) return {};

  return {
    title: state.meta.title,
    description: state.meta.description,
    openGraph: {
      title: state.meta.title,
      description: state.meta.description,
      url: `${SITE.url}/states/${state.slug}`,
    },
    alternates: {
      canonical: `${SITE.url}/states/${state.slug}`,
    },
  };
}

export default async function StatePage({ params }: PageProps) {
  const { state: slug } = await params;
  const state = getStateBySlug(slug);
  if (!state) notFound();

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
        name: `${state.name}`,
        item: `${SITE.url}/states/${state.slug}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: state.faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      <StateHero
        name={state.name}
        headline={state.hero.headline}
        subheadline={state.hero.subheadline}
      />
      <StateRequirements state={state} />
      <CourseCards />
      <StateQuickFacts
        stateName={state.name}
        items={state.quickFacts}
      />
      <StateFaq stateName={state.name} items={state.faqItems} />
      <BottomCta />
    </>
  );
}
