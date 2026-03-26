"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface AffidavitFormProps {
  enrollmentId: string;
  courseName: string;
  studentName: string;
  totalHours: number;
  courseSlug: string;
}

export function AffidavitForm({
  enrollmentId,
  courseName,
  studentName,
  totalHours,
  courseSlug,
}: AffidavitFormProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = agreed && typedName.trim().length >= 2 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/affidavit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, typedName: typedName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign affidavit");
      }

      // Redirect to certificate page
      router.push(`/dashboard/courses/${courseSlug}/certificate`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <ShieldCheck size={22} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-navy">
              Self-Study Affidavit
            </h2>
            <p className="text-sm text-gray-500">
              Required to receive your completion certificate
            </p>
          </div>
        </div>
      </div>

      {/* Affidavit text */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="font-semibold text-navy">
            Self-Study Affidavit — {courseName}
          </p>

          <p>
            I, the undersigned, hereby affirm and declare the following under
            penalty of perjury:
          </p>

          <ol className="space-y-3">
            <li>
              I personally completed all required course modules, section
              quizzes, and the final assessment for the{" "}
              <strong>{courseName}</strong> pre-licensing course offered by
              TestPrep4U.
            </li>
            <li>
              I did not receive unauthorized assistance from any person,
              artificial intelligence tool, or other external resource while
              completing the course content, quizzes, or final examination.
            </li>
            <li>
              I have logged a total of{" "}
              <strong>{totalHours} hours</strong> of study time in the course
              platform, and this time accurately reflects my personal engagement
              with the course material.
            </li>
            <li>
              I understand that misrepresenting my completion of this course may
              result in revocation of my certificate, denial of my insurance
              license application, and/or other penalties as determined by the
              Florida Department of Financial Services.
            </li>
            <li>
              I understand that TestPrep4U maintains audit records of my course
              activity, including timestamps, IP addresses, and session data, and
              that these records may be made available to state regulatory
              authorities upon request.
            </li>
          </ol>
        </div>
      </div>

      {/* Agreement section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm leading-relaxed text-gray-700">
              I have read and understand the above affidavit, and I confirm that
              all statements are true and accurate to the best of my knowledge.
            </span>
          </label>

          {/* Digital signature */}
          <div>
            <label
              htmlFor="typed-name"
              className="mb-1.5 block text-sm font-semibold text-navy"
            >
              Digital Signature — Type Your Full Legal Name
            </label>
            <input
              id="typed-name"
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={studentName}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 font-display text-lg italic text-navy placeholder:text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1.5 text-xs text-gray-400">
              By typing your name above, you are providing a legally binding
              digital signature.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-light p-3">
              <AlertTriangle size={16} className="text-error" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full rounded-lg px-6 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ${
              canSubmit
                ? "bg-blue-500 hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
                : "bg-blue-500 opacity-50 cursor-not-allowed"
            }`}
          >
            {submitting ? "Signing…" : "Sign Affidavit & Continue"}
          </button>
        </div>
      </div>
    </form>
  );
}
