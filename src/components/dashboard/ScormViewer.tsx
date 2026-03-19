"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { ScormAPI, type ScormSessionSummary } from "@/lib/scorm-api";

type ContentSource = "scorm" | "demo";

interface ScormViewerProps {
  onClose: () => void;
  defaultSource?: ContentSource;
}

declare global {
  interface Window {
    API_1484_11?: ScormAPI;
  }
}

export function ScormViewer({
  onClose,
  defaultSource = "scorm",
}: ScormViewerProps) {
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [source, setSource] = useState<ContentSource>(defaultSource);
  const [summary, setSummary] = useState<ScormSessionSummary | null>(null);
  const apiRef = useRef<ScormAPI | null>(null);

  // Set up SCORM API on window before iframe loads
  useEffect(() => {
    const api = new ScormAPI();
    apiRef.current = api;
    window.API_1484_11 = api;

    console.log(
      "%c[SCORM Runtime] API_1484_11 installed on window — ready for content",
      "color: #003152; font-weight: bold; font-size: 13px"
    );

    return () => {
      // Capture final session data before cleanup
      if (apiRef.current) {
        const data = apiRef.current.getSessionSummary();
        console.log(
          "%c[SCORM Runtime] Session Summary:",
          "color: #003152; font-weight: bold",
          data
        );
      }
      delete window.API_1484_11;
      console.log(
        "%c[SCORM Runtime] API_1484_11 removed from window",
        "color: #94a3b8"
      );
    };
  }, []);

  // Listen for close message from demo course content
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data === "scorm-close") {
        handleClose();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = useCallback(() => {
    if (apiRef.current) {
      const data = apiRef.current.getSessionSummary();
      // Only show summary if there's meaningful data
      if (
        data.completionStatus !== "unknown" ||
        data.scoreRaw ||
        data.sessionTime
      ) {
        setSummary(data);
        return;
      }
    }
    onClose();
  }, [onClose]);

  const handleReset = useCallback(() => {
    if (apiRef.current) {
      apiRef.current.reset();
      console.log(
        "%c[SCORM Runtime] Session data reset",
        "color: #f59e0b; font-weight: bold"
      );
    }
    setSummary(null);
    setLoading(true);
  }, []);

  const iframeSrc =
    source === "scorm"
      ? "/scorm/golf-example/shared/launchpage.html"
      : "/scorm/demo-course/index.html";

  // Session summary overlay
  if (summary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-navy">
              SCORM Session Summary
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="space-y-4 p-6">
            {/* Completion & Success */}
            <div className="grid grid-cols-2 gap-4">
              <StatusCard
                label="Completion"
                value={summary.completionStatus}
                icon={
                  summary.completionStatus === "completed" ? (
                    <CheckCircle2 size={20} className="text-success" />
                  ) : (
                    <Clock size={20} className="text-warning" />
                  )
                }
                variant={
                  summary.completionStatus === "completed"
                    ? "success"
                    : "default"
                }
              />
              <StatusCard
                label="Success"
                value={summary.successStatus}
                icon={
                  summary.successStatus === "passed" ? (
                    <CheckCircle2 size={20} className="text-success" />
                  ) : summary.successStatus === "failed" ? (
                    <XCircle size={20} className="text-error" />
                  ) : (
                    <Target size={20} className="text-gray-400" />
                  )
                }
                variant={
                  summary.successStatus === "passed"
                    ? "success"
                    : summary.successStatus === "failed"
                      ? "error"
                      : "default"
                }
              />
            </div>

            {/* Score */}
            {summary.scoreRaw && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <Target size={14} />
                  Score
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-navy">
                    {summary.scoreRaw}
                  </span>
                  {summary.scoreMax && (
                    <span className="text-sm text-gray-500">
                      / {summary.scoreMax}
                    </span>
                  )}
                  {summary.scoreScaled && (
                    <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-500">
                      {Math.round(parseFloat(summary.scoreScaled) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Session details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {summary.sessionTime && (
                <div>
                  <span className="text-gray-500">Session Time</span>
                  <p className="font-medium text-navy">
                    {formatScormTime(summary.sessionTime)}
                  </p>
                </div>
              )}
              {summary.location && (
                <div>
                  <span className="text-gray-500">Bookmark (Page)</span>
                  <p className="font-medium text-navy">
                    {parseInt(summary.location, 10) + 1}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Interactions</span>
                <p className="font-medium text-navy">
                  {summary.totalInteractions}
                </p>
              </div>
            </div>

            {/* Data captured notice */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-100/40 p-3">
              <BookOpen
                size={18}
                className="mt-0.5 flex-shrink-0 text-blue-500"
              />
              <p className="text-xs leading-relaxed text-gray-600">
                All SCORM data was captured via the API_1484_11 runtime.
                Open the browser console to see the full communication log.
                In production, this data would sync to Supabase for persistent
                progress tracking.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <RotateCcw size={14} />
              Reset & Relaunch
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)]"
            >
              Return to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
      {/* Header */}
      <div className="flex items-center justify-between bg-navy px-5 py-3">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-sm font-semibold text-white">
            Course Content Viewer
          </h2>
          {/* Source toggle */}
          <div className="flex rounded-md border border-white/20">
            <button
              onClick={() => {
                setSource("scorm");
                setLoading(true);
              }}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                source === "scorm"
                  ? "bg-white/20 text-white"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              SCORM Golf Example
            </button>
            <button
              onClick={() => {
                setSource("demo");
                setLoading(true);
              }}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                source === "demo"
                  ? "bg-white/20 text-white"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              Insurance Demo
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close viewer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Iframe container */}
      <div
        className={`relative flex-1 bg-white ${
          fullscreen
            ? ""
            : "mx-auto my-4 w-full max-w-6xl overflow-hidden rounded-lg shadow-2xl"
        }`}
      >
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm text-gray-500">
                Loading course content...
              </p>
            </div>
          </div>
        )}

        <iframe
          key={source}
          src={iframeSrc}
          className="h-full w-full border-0"
          title="Course Content"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}

// -- Helper components --

function StatusCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant: "success" | "error" | "default";
}) {
  const bg =
    variant === "success"
      ? "bg-success-light"
      : variant === "error"
        ? "bg-error-light"
        : "bg-gray-100";

  return (
    <div className={`rounded-lg p-4 ${bg}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>
      <p className="mt-1 font-display text-lg font-bold capitalize text-navy">
        {value}
      </p>
    </div>
  );
}

// Parse SCORM 2004 time format (e.g., "PT1M23.4S") into a readable string
function formatScormTime(isoTime: string): string {
  const match = isoTime.match(
    /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/
  );
  if (!match) return isoTime;

  const parts: string[] = [];
  if (match[4]) parts.push(`${match[4]}h`);
  if (match[5]) parts.push(`${match[5]}m`);
  if (match[6]) parts.push(`${Math.round(parseFloat(match[6]))}s`);

  return parts.length > 0 ? parts.join(" ") : "< 1s";
}
