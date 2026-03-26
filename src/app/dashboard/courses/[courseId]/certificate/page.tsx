import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Download,
  ExternalLink,
  CheckCircle2,
  Fingerprint,
  Building2,
  Calendar,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCourseDetail } from "@/lib/course-data";
import { CertificateActions } from "@/components/dashboard/CertificateActions";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const detail = await getCourseDetail(courseId);
  if (!detail) redirect("/dashboard");

  // Must have affidavit signed to view certificate
  if (!detail.hasAffidavit) {
    // If eligible for affidavit but haven't signed, redirect there
    if (detail.finalExamPassed && detail.meetsHourRequirement) {
      redirect(`/dashboard/courses/${courseId}/affidavit`);
    }
    redirect(`/dashboard/courses/${courseId}`);
  }

  // Check for existing certificate
  const { data: certificate } = await supabase
    .from("certificates")
    .select("id, certificate_number, issued_at, hours_completed, pdf_url")
    .eq("enrollment_id", detail.enrollment.enrollmentId)
    .single();

  const meta = user.user_metadata || {};
  const studentName =
    meta.full_name ||
    [meta.first_name, meta.last_name].filter(Boolean).join(" ") ||
    user.email ||
    "";

  const totalHours =
    certificate?.hours_completed ??
    Math.round((detail.totalTimeSeconds / 3600) * 10) / 10;

  // Program name
  const programNames: Record<string, string> = {
    life: "Florida 2-14 Life Including Annuities & Variable Contracts Pre-Licensing",
    health: "Florida 2-15 Health Insurance Pre-Licensing",
    combined: "Florida 2-15 Life, Health & Variable Annuity Pre-Licensing",
  };
  const programName =
    programNames[detail.enrollment.courseType] ||
    detail.enrollment.courseName;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/dashboard/courses/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to {detail.enrollment.courseName}
      </Link>

      {/* Congratulations header */}
      <div className="rounded-xl border border-success/30 bg-success-light p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Award size={32} className="text-success" />
        </div>
        <h2 className="font-display text-2xl font-bold text-navy">
          Congratulations, {studentName.split(" ")[0] || "Student"}!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          You have successfully completed the{" "}
          <span className="font-semibold">{programName}</span> course.
        </p>
      </div>

      {/* Certificate preview card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Award size={22} className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-navy">
              Completion Certificate
            </h3>
            <p className="text-sm text-gray-500">
              {certificate
                ? `Certificate #${certificate.certificate_number}`
                : "Ready to generate"}
            </p>
          </div>
        </div>

        {/* Certificate details */}
        <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Student</span>
              <p className="font-medium text-navy">{studentName}</p>
            </div>
            <div>
              <span className="text-gray-500">Program</span>
              <p className="font-medium text-navy">
                {detail.enrollment.courseName}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Hours Completed</span>
              <p className="font-medium text-navy">{totalHours} hours</p>
            </div>
            <div>
              <span className="text-gray-500">Completion Date</span>
              <p className="font-medium text-navy">
                {certificate
                  ? new Date(certificate.issued_at).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </p>
            </div>
          </div>
        </div>

        {/* Generate / Download button */}
        <CertificateActions
          enrollmentId={detail.enrollment.enrollmentId}
          hasExistingCertificate={!!certificate}
        />
      </div>

      {/* Completion checklist */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-lg font-semibold text-navy">
          Course Completion Summary
        </h3>
        <div className="space-y-3">
          <CompletionItem
            label="All course modules completed"
            done={detail.allSectionsComplete}
          />
          <CompletionItem
            label="All section quizzes passed"
            done={detail.allSectionsComplete}
          />
          <CompletionItem
            label="Final exam passed at 70%+"
            done={detail.finalExamPassed}
          />
          <CompletionItem
            label={`${detail.enrollment.requiredHours}-hour seat time requirement met`}
            done={detail.meetsHourRequirement}
          />
          <CompletionItem
            label="Self-study affidavit signed"
            done={detail.hasAffidavit}
          />
          <CompletionItem
            label="Certificate generated"
            done={!!certificate}
          />
        </div>
      </div>

      {/* Next steps */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-lg font-semibold text-navy">
          Next Steps — Get Your Florida Insurance License
        </h3>
        <div className="space-y-4">
          <NextStep
            icon={<Calendar size={20} className="text-blue-500" />}
            title="1. Schedule Your State Exam"
            description="Register and schedule your Florida insurance license exam through Pearson VUE. You'll need your completion certificate number."
            linkText="Schedule at Pearson VUE"
            linkHref="https://home.pearsonvue.com/fl/insurance"
          />
          <NextStep
            icon={<Fingerprint size={20} className="text-blue-500" />}
            title="2. Complete Fingerprinting"
            description="Florida requires electronic fingerprinting for all insurance license applicants. Visit an approved MorphoTrust/Idemia location."
            linkText="Find a fingerprinting location"
            linkHref="https://www.fieldprintflorida.com"
          />
          <NextStep
            icon={<Building2 size={20} className="text-blue-500" />}
            title="3. Get Appointed by an Insurer"
            description="After passing your state exam, you'll need to be appointed by an insurance company or join an agency to begin selling insurance."
          />
        </div>
      </div>
    </div>
  );
}

function CompletionItem({
  label,
  done,
}: {
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <CheckCircle2
        size={18}
        className={done ? "text-success" : "text-gray-300"}
      />
      <span
        className={`text-sm ${done ? "text-gray-700" : "text-gray-400"}`}
      >
        {label}
      </span>
    </div>
  );
}

function NextStep({
  icon,
  title,
  description,
  linkText,
  linkHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
}) {
  return (
    <div className="flex gap-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
        {icon}
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-navy">
          {title}
        </p>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {linkText && linkHref && (
          <a
            href={linkHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-500 transition-colors hover:text-blue-600"
          >
            {linkText}
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
