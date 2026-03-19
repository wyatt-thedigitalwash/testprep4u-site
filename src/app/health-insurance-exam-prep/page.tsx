import type { Metadata } from "next";
import { coursePages } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { CourseHero } from "@/components/sections/CourseHero";
import { ExamTable } from "@/components/sections/ExamTable";
import { CourseFeatures } from "@/components/sections/CourseFeatures";
import { PricingCards } from "@/components/ui/PricingCards";
import { Guarantee } from "@/components/sections/Guarantee";
import { CourseFaq } from "@/components/sections/CourseFaq";
import { BottomCta } from "@/components/sections/BottomCta";

const course = coursePages.health;
const slug = "health-insurance-exam-prep";

export const metadata: Metadata = {
  title: course.meta.title,
  description: course.meta.description,
  openGraph: {
    title: course.meta.title,
    description: course.meta.description,
    url: `${SITE.url}/${slug}`,
  },
  alternates: {
    canonical: `${SITE.url}/${slug}`,
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
      name: course.headline,
      item: `${SITE.url}/${slug}`,
    },
  ],
};

const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: course.headline,
  description: course.meta.description,
  provider: {
    "@type": "Organization",
    name: "TestPrep4U",
    sameAs: SITE.url,
  },
  educationalLevel: "Beginner",
  coursePrerequisites: "None",
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "Online",
    courseWorkload: "PT40H",
  },
};

export default function HealthInsurancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <CourseHero courseType="health" />
      <ExamTable courseType="health" />
      <CourseFeatures courseType="health" />
      <PricingCards courseType="health" showToggle={false} />
      <Guarantee />
      <CourseFaq courseType="health" />
      <BottomCta
        headline="Ready to Get Your Health Insurance License?"
        body="State-approved pre-licensing course with AI-powered practice exams, study guides, and 24/7 support."
        cta={course.cta}
      />
    </>
  );
}
