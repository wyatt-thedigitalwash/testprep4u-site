"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Search,
  XCircle,
  CheckCircle2,
  Trash2,
  Download,
  Loader2,
  Mail,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
}

/* ── Admin Users Section ───────────────────────────────────── */

export function AdminUsersSection({
  admins,
  currentUserId,
}: {
  admins: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleGrant() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_admin", email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message);
      setEmail("");
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(userId: string) {
    if (userId === currentUserId) {
      showToast("error", "You cannot revoke your own admin access.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_admin", userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message);
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={14} />
          ) : (
            <XCircle size={14} />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
          <Shield size={20} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-gray-900">
            Admin Users
          </h3>
          <p className="text-xs text-gray-400">
            {admins.length} admin{admins.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Current admins */}
      <div className="mb-4 space-y-2">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {admin.full_name || "Unknown"}
                {admin.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(you)</span>
                )}
              </p>
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Mail size={10} /> {admin.email}
              </p>
            </div>
            {admin.id !== currentUserId && (
              <button
                onClick={() => handleRevoke(admin.id)}
                disabled={loading}
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                title="Revoke admin access"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Grant admin */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGrant();
            }}
            placeholder="Enter email to grant admin access..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <button
          onClick={handleGrant}
          disabled={loading || !email.trim()}
          className="rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-violet-600 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Grant"}
        </button>
      </div>
    </div>
  );
}

/* ── Data Export Section ───────────────────────────────────── */

export function DataExportSection() {
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTime, setLoadingTime] = useState(false);

  async function downloadCsv(url: string, filename: string, setLoad: (v: boolean) => void) {
    setLoad(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setLoad(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
          <Download size={20} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-gray-900">
            Data Export
          </h3>
          <p className="text-xs text-gray-400">
            Export data for reporting and Florida DFS audits.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() =>
            downloadCsv(
              "/api/admin/students/export",
              `students-${new Date().toISOString().split("T")[0]}.csv`,
              setLoadingStudents
            )
          }
          disabled={loadingStudents}
          className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingStudents ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
            <Download size={16} className="text-violet-500" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">Student Data</p>
            <p className="text-xs text-gray-400">
              Names, enrollments, progress, seat time
            </p>
          </div>
        </button>

        <button
          onClick={() =>
            downloadCsv(
              "/api/admin/export/time-logs",
              `time-logs-${new Date().toISOString().split("T")[0]}.csv`,
              setLoadingTime
            )
          }
          disabled={loadingTime}
          className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingTime ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : (
            <Download size={16} className="text-violet-500" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              Time Logs (DFS)
            </p>
            <p className="text-xs text-gray-400">
              Session-level seat time audit trail
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ── Revenue Backfill Section ────────────────────────────────── */

export function BackfillSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    backfilled: number;
    failed: number;
    total: number;
    errors: Array<{ enrollmentId: string; error: string }>;
  } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleBackfill() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/backfill-revenue", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backfill failed");
      setResult(data);
      setConfirmed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
          <DollarSign size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-gray-900">
            Revenue Backfill
          </h3>
          <p className="text-xs text-gray-400">
            Populate revenue fields on existing enrollments from Stripe session
            data. One-time operation.
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 ${
            result.failed > 0
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <p
            className={`text-sm font-medium ${result.failed > 0 ? "text-amber-700" : "text-emerald-700"}`}
          >
            {result.message}
          </p>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-amber-600">
                {result.errors.length} error
                {result.errors.length !== 1 ? "s" : ""} — click to expand
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-600">
                    <span className="font-mono">
                      {e.enrollmentId.slice(0, 8)}…
                    </span>
                    : {e.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <XCircle size={14} className="text-red-500" />
          <span className="text-xs font-medium text-red-600">{error}</span>
        </div>
      )}

      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          disabled={loading}
          className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <DollarSign size={16} className="text-amber-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Backfill Revenue Data
            </p>
            <p className="text-xs text-gray-400">
              Fetches Stripe session data for enrollments missing revenue fields
            </p>
          </div>
        </button>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-700">
                This will query Stripe for every enrollment missing revenue
                data.
              </p>
              <p className="mt-1 text-xs text-amber-600">
                It may take a while if there are many enrollments. Stripe rate
                limits apply.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setConfirmed(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBackfill}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Backfilling…
                    </>
                  ) : (
                    "Run Backfill"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
