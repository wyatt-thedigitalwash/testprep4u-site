"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ArrowUpDown,
  XCircle,
  KeyRound,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface StudentActionsProps {
  userId: string;
  currentTier: string | null;
  enrollmentStatus: string | null;
}

export function StudentActions({
  userId,
  currentTier,
  enrollmentStatus,
}: StudentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [months, setMonths] = useState(3);
  const [newTier, setNewTier] = useState(currentTier || "essentials");

  function clearMessages() {
    setSuccess(null);
    setError(null);
  }

  async function callAction(
    action: string,
    body: Record<string, unknown> = {}
  ) {
    clearMessages();
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/students/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setSuccess(data.message || "Done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
      setShowExtendModal(false);
      setShowTierModal(false);
      setShowRevokeConfirm(false);
    }
  }

  async function handleResetPassword() {
    clearMessages();
    setLoading("reset");
    try {
      const res = await fetch(
        `/api/admin/students/${userId}/reset-password`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      setSuccess("Password reset email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  const hasEnrollment = enrollmentStatus === "active" || enrollmentStatus === "completed";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-display text-sm font-semibold text-gray-900">
        Actions
      </h3>

      {/* Success/error messages */}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">
            {success}
          </span>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <XCircle size={14} className="text-red-500" />
          <span className="text-xs font-medium text-red-600">{error}</span>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => {
            clearMessages();
            setShowExtendModal(true);
          }}
          disabled={!hasEnrollment || loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          <CalendarPlus size={14} />
          Extend Access
        </button>
        <button
          onClick={() => {
            clearMessages();
            setShowTierModal(true);
          }}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          <ArrowUpDown size={14} />
          Change Tier
        </button>
        <button
          onClick={handleResetPassword}
          disabled={loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
        >
          {loading === "reset" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <KeyRound size={14} />
          )}
          Reset Password
        </button>
        <button
          onClick={() => {
            clearMessages();
            setShowRevokeConfirm(true);
          }}
          disabled={!hasEnrollment || loading !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
        >
          <XCircle size={14} />
          Revoke Access
        </button>
      </div>

      {/* Extend modal */}
      {showExtendModal && (
        <Modal
          title="Extend Access"
          onClose={() => setShowExtendModal(false)}
        >
          <label className="block text-sm text-gray-600">
            Add months to current expiration:
          </label>
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {[1, 2, 3, 6, 9, 12].map((m) => (
              <option key={m} value={m}>
                {m} month{m !== 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowExtendModal(false)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => callAction("extend", { months })}
              disabled={loading !== null}
              className="flex-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50"
            >
              {loading === "extend" ? "Extending…" : "Extend"}
            </button>
          </div>
        </Modal>
      )}

      {/* Tier modal */}
      {showTierModal && (
        <Modal
          title="Change Tier"
          onClose={() => setShowTierModal(false)}
        >
          <label className="block text-sm text-gray-600">
            Current: <span className="font-semibold capitalize">{currentTier || "none"}</span>
          </label>
          <select
            value={newTier}
            onChange={(e) => setNewTier(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="essentials">Essentials</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowTierModal(false)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => callAction("change_tier", { tier: newTier })}
              disabled={loading !== null}
              className="flex-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50"
            >
              {loading === "change_tier" ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {/* Revoke confirm */}
      {showRevokeConfirm && (
        <Modal
          title="Revoke Access"
          onClose={() => setShowRevokeConfirm(false)}
        >
          <p className="text-sm text-gray-500">
            This will expire all active enrollments for this student. They will
            lose access to course materials immediately.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowRevokeConfirm(false)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => callAction("revoke")}
              disabled={loading !== null}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {loading === "revoke" ? "Revoking…" : "Revoke Access"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 font-display text-lg font-semibold text-gray-900">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
