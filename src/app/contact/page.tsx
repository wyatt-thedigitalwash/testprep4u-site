import type { Metadata } from "next";
import { contactPage } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { ContactHero } from "@/components/sections/ContactHero";
import { ContactForm } from "@/components/sections/ContactForm";
import { Guarantee } from "@/components/sections/Guarantee";

export const metadata: Metadata = {
  title: contactPage.meta.title,
  description: contactPage.meta.description,
  openGraph: {
    title: contactPage.meta.title,
    description: contactPage.meta.description,
    url: `${SITE.url}/contact`,
  },
  alternates: {
    canonical: `${SITE.url}/contact`,
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
      name: "Contact",
      item: `${SITE.url}/contact`,
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ContactHero />
      <ContactForm />
      <Guarantee />
    </>
  );
}
