"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";

interface CertificateActionsProps {
  enrollmentId: string;
  hasExistingCertificate: boolean;
}

export function CertificateActions({
  enrollmentId,
  hasExistingCertificate,
}: CertificateActionsProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generated, setGenerated] = useState(hasExistingCertificate);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate certificate");
      }

      setGenerated(true);
      // Refresh server data to show updated certificate info
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/certificates/download?enrollmentId=${enrollmentId}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to download certificate");
      }

      const { url } = await res.json();

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "TestPrep4U-Certificate.pdf";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {!generated ? (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Certificate…
            </>
          ) : (
            "Generate Certificate"
          )}
        </button>
      ) : (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Preparing Download…
            </>
          ) : (
            <>
              <Download size={16} />
              Download Certificate (PDF)
            </>
          )}
        </button>
      )}
    </div>
  );
}
