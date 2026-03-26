"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BookOpen,
} from "lucide-react";
import { ScormAPI, type ScormSessionSummary } from "@/lib/scorm-api";

interface ModuleLauncherProps {
  moduleId: string;
  moduleTitle: string;
  scormEntryPath: string;
  courseSlug: string;
  enrollmentId: string;
  learnerId: string;
  learnerName: string;
}

declare global {
  interface Window {
    API_1484_11?: ScormAPI;
  }
}

export function ModuleLauncher({
  moduleTitle,
  scormEntryPath,
  courseSlug,
  enrollmentId,
  moduleId,
  learnerId,
  learnerName,
}: ModuleLauncherProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [summary, setSummary] = useState<ScormSessionSummary | null>(null);
  const apiRef = useRef<ScormAPI | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const saveInFlightRef = useRef(false);

  // Save progress to server
  const saveProgress = useCallback(
    async (sessionData: ScormSessionSummary, isFinal: boolean) => {
      // If a save is in flight, skip intermediate saves but wait for final
      if (saveInFlightRef.current && !isFinal) return;
      if (saveInFlightRef.current && isFinal) {
        // Wait for the in-flight save to finish before sending the final save
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            if (!saveInFlightRef.current) {
              clearInterval(interval);
              resolve();
            }
          }, 50);
        });
      }
      saveInFlightRef.current = true;

      const sessionSeconds = Math.round(
        (Date.now() - sessionStartRef.current) / 1000
      );

      try {
        await fetch("/api/scorm/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentId,
            moduleId,
            completionStatus: sessionData.completionStatus,
            successStatus: sessionData.successStatus,
            scoreRaw: sessionData.scoreRaw || null,
            scoreScaled: sessionData.scoreScaled || null,
            location: sessionData.location || null,
            suspendData: sessionData.suspendData || null,
            sessionTimeSeconds: sessionSeconds,
            cmiData: sessionData.allData,
            isFinal,
          }),
        });
      } catch {
        console.error("[ModuleLauncher] Failed to save progress");
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [enrollmentId, moduleId]
  );

  // Fetch saved CMI data and set up SCORM API
  useEffect(() => {
    let cancelled = false;

    async function initApi() {
      // Fetch existing progress for resume
      let initialData = undefined;
      try {
        const res = await fetch(
          `/api/scorm/load?enrollmentId=${enrollmentId}&moduleId=${moduleId}`
        );
        if (res.ok) {
          const loaded = await res.json();
          if (loaded.cmiData) {
            initialData = loaded.cmiData;
          }
        }
      } catch {
        console.warn("[ModuleLauncher] Could not load saved progress — starting fresh");
      }

      if (cancelled) return;

      // Create SCORM API with saved data and callbacks
      const api = new ScormAPI({
        initialData,
        learnerId,
        learnerName,
        onCommit: (data) => {
          // Intermediate save on every Commit (Rise auto-commits every 20s)
          saveProgress(data, false);
        },
        onTerminate: (data) => {
          // Final save + show summary
          saveProgress(data, true);
          setSummary(data);
        },
      });

      apiRef.current = api;
      window.API_1484_11 = api;
      sessionStartRef.current = Date.now();
      setApiReady(true);

      console.log(
        "%c[ModuleLauncher] SCORM API mounted on window.API_1484_11",
        "color: #447FF0; font-weight: bold"
      );
    }

    initApi();

    return () => {
      cancelled = true;
      delete window.API_1484_11;
    };
  }, [enrollmentId, moduleId, learnerId, learnerName, saveProgress]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle close button — if content didn't call Terminate, do a final save
  const handleClose = useCallback(() => {
    if (apiRef.current) {
      const data = apiRef.current.getSessionSummary();
      // If we have meaningful progress, save and show summary
      if (
        data.completionStatus !== "unknown" ||
        data.scoreRaw ||
        data.sessionTime ||
        data.suspendData
      ) {
        saveProgress(data, true);
        setSummary(data);
        return;
      }
    }
    router.push(`/dashboard/courses/${courseSlug}`);
  }, [courseSlug, router, saveProgress]);

  // Save progress on tab close / browser back via sendBeacon
  useEffect(() => {
    function handleBeforeUnload() {
      if (!apiRef.current) return;
      const data = apiRef.current.getSessionSummary();
      const sessionSeconds = Math.round(
        (Date.now() - sessionStartRef.current) / 1000
      );
      const payload = JSON.stringify({
        enrollmentId,
        moduleId,
        completionStatus: data.completionStatus,
        successStatus: data.successStatus,
        scoreRaw: data.scoreRaw || null,
        scoreScaled: data.scoreScaled || null,
        location: data.location || null,
        suspendData: data.suspendData || null,
        sessionTimeSeconds: sessionSeconds,
        cmiData: data.allData,
        isFinal: true,
      });
      navigator.sendBeacon("/api/scorm/save", payload);
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enrollmentId, moduleId]);

  // Listen for close message from SCORM content
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data === "scorm-close") {
        handleClose();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleClose]);

  const handleReturn = useCallback(() => {
    router.push(`/dashboard/courses/${courseSlug}`);
    router.refresh();
  }, [courseSlug, router]);

  // TODO: Move SCORM packages to Supabase Storage and serve via signed URLs.
  // Currently served from public/ directory — accessible without authentication.
  const iframeSrc = `/${scormEntryPath}`;

  // Session summary overlay
  if (summary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-navy">
              Session Complete
            </h2>
            <button
              onClick={handleReturn}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 p-6">
            <p className="text-sm font-medium text-navy">{moduleTitle}</p>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`rounded-lg p-4 ${
                  summary.completionStatus === "completed"
                    ? "bg-success-light"
                    : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {summary.completionStatus === "completed" ? (
                    <CheckCircle2 size={14} className="text-success" />
                  ) : (
                    <Clock size={14} className="text-gray-400" />
                  )}
                  Completion
                </div>
                <p className="mt-1 font-display text-lg font-bold capitalize text-navy">
                  {summary.completionStatus}
                </p>
              </div>
              <div
                className={`rounded-lg p-4 ${
                  summary.successStatus === "passed"
                    ? "bg-success-light"
                    : summary.successStatus === "failed"
                      ? "bg-error-light"
                      : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {summary.successStatus === "passed" ? (
                    <CheckCircle2 size={14} className="text-success" />
                  ) : summary.successStatus === "failed" ? (
                    <XCircle size={14} className="text-error" />
                  ) : (
                    <Target size={14} className="text-gray-400" />
                  )}
                  Success
                </div>
                <p className="mt-1 font-display text-lg font-bold capitalize text-navy">
                  {summary.successStatus}
                </p>
              </div>
            </div>

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
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-100/40 p-3">
              <BookOpen
                size={18}
                className="mt-0.5 flex-shrink-0 text-blue-500"
              />
              <p className="text-xs leading-relaxed text-gray-600">
                Your progress and time have been saved. You can return to this
                module to continue where you left off.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleReturn}
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
        <h2 className="font-display text-sm font-semibold text-white">
          {moduleTitle}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Iframe — only render after API is ready */}
      <div
        className={`relative flex-1 bg-white ${
          fullscreen
            ? ""
            : "mx-auto my-4 w-full max-w-6xl overflow-hidden rounded-lg shadow-2xl"
        }`}
      >
        {(loading || !apiReady) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm text-gray-500">
                {apiReady ? "Loading course content…" : "Preparing session…"}
              </p>
            </div>
          </div>
        )}
        {apiReady && (
          <iframe
            src={iframeSrc}
            className="h-full w-full border-0"
            title={moduleTitle}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
}
