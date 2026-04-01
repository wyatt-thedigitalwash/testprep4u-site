"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Maximize2, Minimize2, ArrowRight, CheckCircle2 } from "lucide-react";
import { ScormAPI, type ScormSessionSummary } from "@/lib/scorm-api";

interface ModuleLauncherProps {
  moduleId: string;
  moduleTitle: string;
  scormEntryPath: string;
  courseSlug: string;
  enrollmentId: string;
  learnerId: string;
  learnerName: string;
  /** ID of the next sequential module, or null if this is the last module */
  nextModuleId: string | null;
  /** Whether this is the very last module in the course */
  isLastModule: boolean;
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
  nextModuleId,
  isLastModule,
}: ModuleLauncherProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [apiReady, setApiReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const apiRef = useRef<ScormAPI | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const saveInFlightRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  // Navigate back to course detail, optionally with completion flag
  const navigateBack = useCallback(
    (completedModuleId?: string) => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      const params = completedModuleId
        ? `?completed=${completedModuleId}`
        : "";
      router.push(`/dashboard/courses/${courseSlug}${params}`);
      router.refresh();
    },
    [courseSlug, router]
  );

  // Save progress to server (fire-and-forget for final saves on close)
  const saveProgress = useCallback(
    async (sessionData: ScormSessionSummary, isFinal: boolean) => {
      // If a save is in flight, skip intermediate saves but wait for final
      if (saveInFlightRef.current && !isFinal) return;
      if (saveInFlightRef.current && isFinal) {
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
        setSaveError(true);
        setTimeout(() => setSaveError(false), 5000);
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
          // Detect when the lesson is marked complete
          if (data.completionStatus === "completed") {
            setLessonCompleted(true);
          }
        },
        onTerminate: (data) => {
          // Final save in background
          saveProgress(data, true);
          // If the lesson was completed and user hasn't clicked "Complete & Continue",
          // stay on the page so they can use the button. Otherwise navigate back.
          const didComplete = data.completionStatus === "completed";
          if (didComplete) {
            setLessonCompleted(true);
          } else {
            navigateBack();
          }
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
  }, [enrollmentId, moduleId, learnerId, learnerName, saveProgress, navigateBack]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Handle close button — save in background, navigate back immediately
  const handleClose = useCallback(() => {
    if (hasNavigatedRef.current) return;
    if (apiRef.current) {
      const data = apiRef.current.getSessionSummary();
      const didComplete = data.completionStatus === "completed";
      // Fire-and-forget save
      if (
        data.completionStatus !== "unknown" ||
        data.scoreRaw ||
        data.sessionTime ||
        data.suspendData
      ) {
        saveProgress(data, true);
      }
      navigateBack(didComplete ? moduleId : undefined);
    } else {
      navigateBack();
    }
  }, [moduleId, navigateBack, saveProgress]);

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

  // Handle "Complete & Continue" — save, terminate, navigate to next module
  const handleContinue = useCallback(async () => {
    if (hasNavigatedRef.current) return;
    setContinueLoading(true);

    // Save final progress
    if (apiRef.current) {
      const data = apiRef.current.getSessionSummary();
      await saveProgress(data, true);
    }

    hasNavigatedRef.current = true;

    if (nextModuleId) {
      router.push(`/dashboard/courses/${courseSlug}/module/${nextModuleId}`);
      router.refresh();
    } else {
      // Last module — navigate to course detail with completion flag
      router.push(`/dashboard/courses/${courseSlug}?completed=${moduleId}`);
      router.refresh();
    }
  }, [nextModuleId, courseSlug, moduleId, router, saveProgress]);

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

  // TODO: Move SCORM packages to Supabase Storage and serve via signed URLs.
  // Currently served from public/ directory — accessible without authentication.
  const iframeSrc = `/${scormEntryPath}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70">
      {/* Save error toast */}
      {saveError && (
        <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 shadow-lg">
          Progress save failed — your work may not be saved.
        </div>
      )}

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
        className={`relative bg-white ${
          fullscreen
            ? "flex-1"
            : lessonCompleted
              ? "mx-auto mt-4 w-full max-w-6xl flex-1 overflow-hidden rounded-t-lg shadow-2xl"
              : "mx-auto my-4 w-full max-w-6xl flex-1 overflow-hidden rounded-lg shadow-2xl"
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

      {/* Complete & Continue bar — appears when lesson is completed */}
      {lessonCompleted && !fullscreen && (
        <div className="mx-auto w-full max-w-6xl rounded-b-lg border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-success" />
              <span className="text-sm font-semibold text-navy">
                Lesson complete
              </span>
            </div>
            <button
              onClick={handleContinue}
              disabled={continueLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-8 py-3 font-body font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-60"
            >
              {continueLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : isLastModule ? (
                <>
                  Complete Course
                  <CheckCircle2 size={16} />
                </>
              ) : (
                <>
                  Complete & Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Complete & Continue for fullscreen mode */}
      {lessonCompleted && fullscreen && (
        <div className="border-t border-gray-200 bg-white px-5 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="text-success" />
              <span className="text-sm font-semibold text-navy">
                Lesson complete
              </span>
            </div>
            <button
              onClick={handleContinue}
              disabled={continueLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-8 py-3 font-body font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-60"
            >
              {continueLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : isLastModule ? (
                <>
                  Complete Course
                  <CheckCircle2 size={16} />
                </>
              ) : (
                <>
                  Complete & Continue
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
