"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Tag,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  User,
  DollarSign,
  Calendar,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

export interface DiscountCodeData {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  redemptions: Array<{
    id: string;
    user_name: string;
    user_email: string;
    amount_discounted: number;
    stripe_checkout_session_id: string;
    created_at: string;
  }>;
}

interface FormState {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  max_uses: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  discount_type: "percentage",
  discount_value: "",
  max_uses: "",
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: "",
  is_active: true,
};

/* ── Main component ────────────────────────────────────────── */

export function DiscountCodesManager({
  codes,
}: {
  codes: DiscountCodeData[];
}) {
  const router = useRouter();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function updateForm(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.code.trim() || !form.discount_value) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
          valid_from: form.valid_from || null,
          valid_until: form.valid_until || null,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(codeId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          codeId,
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
          valid_from: form.valid_from || null,
          valid_until: form.valid_until || null,
          is_active: form.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(codeId: string, active: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          codeId,
          is_active: active,
        }),
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

  async function handleDelete(codeId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discount-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", codeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message);
      setDeleteConfirmId(null);
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(code: DiscountCodeData) {
    setForm({
      code: code.code,
      discount_type: code.discount_type as "percentage" | "fixed",
      discount_value: String(code.discount_value),
      max_uses: code.max_uses != null ? String(code.max_uses) : "",
      valid_from: code.valid_from ? code.valid_from.split("T")[0] : "",
      valid_until: code.valid_until ? code.valid_until.split("T")[0] : "",
      is_active: code.is_active,
    });
    setEditingId(code.id);
    setShowCreate(false);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            Discount Codes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {codes.length} code{codes.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-violet-600"
        >
          <Plus size={16} />
          Create Code
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CodeForm
          title="Create Discount Code"
          form={form}
          onUpdate={updateForm}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowCreate(false);
            setForm(EMPTY_FORM);
          }}
          loading={loading}
          submitLabel="Create"
          showCodeField
        />
      )}

      {/* Edit form */}
      {editingId && (
        <CodeForm
          title={`Edit: ${form.code}`}
          form={form}
          onUpdate={updateForm}
          onSubmit={() => handleUpdate(editingId)}
          onCancel={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          loading={loading}
          submitLabel="Save Changes"
          showCodeField={false}
        />
      )}

      {/* Codes table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Valid Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <CodeRow
                  key={code.id}
                  code={code}
                  isExpanded={expandedId === code.id}
                  loading={loading}
                  onToggleExpand={() =>
                    setExpandedId(
                      expandedId === code.id ? null : code.id
                    )
                  }
                  onEdit={() => openEdit(code)}
                  onToggle={() => handleToggle(code.id, !code.is_active)}
                  onDelete={() => setDeleteConfirmId(code.id)}
                />
              ))}
              {codes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-gray-400"
                  >
                    No discount codes yet. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-gray-900">
              Delete Code?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete this discount code and all
              redemption records.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={loading}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Code form ─────────────────────────────────────────────── */

function CodeForm({
  title,
  form,
  onUpdate,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
  showCodeField,
}: {
  title: string;
  form: FormState;
  onUpdate: (field: keyof FormState, value: string | boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
  showCodeField: boolean;
}) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-gray-900">
          {title}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showCodeField && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Code
            </label>
            <input
              value={form.code}
              onChange={(e) =>
                onUpdate("code", e.target.value.toUpperCase())
              }
              placeholder="SAVE20"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono uppercase tracking-wider focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Type
          </label>
          <select
            value={form.discount_type}
            onChange={(e) => onUpdate("discount_type", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Value
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {form.discount_type === "percentage" ? "%" : "$"}
            </span>
            <input
              type="number"
              value={form.discount_value}
              onChange={(e) => onUpdate("discount_value", e.target.value)}
              placeholder="20"
              min={0}
              max={form.discount_type === "percentage" ? 100 : undefined}
              className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Max Uses (blank = unlimited)
          </label>
          <input
            type="number"
            value={form.max_uses}
            onChange={(e) => onUpdate("max_uses", e.target.value)}
            placeholder="∞"
            min={1}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Valid From
          </label>
          <input
            type="date"
            value={form.valid_from}
            onChange={(e) => onUpdate("valid_from", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Valid Until (blank = no expiry)
          </label>
          <input
            type="date"
            value={form.valid_until}
            onChange={(e) => onUpdate("valid_until", e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => onUpdate("is_active", e.target.checked)}
            className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
          />
          Active
        </label>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !form.discount_value}
            className="rounded-lg bg-violet-500 px-5 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50"
          >
            {loading ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Code table row ────────────────────────────────────────── */

function CodeRow({
  code,
  isExpanded,
  loading,
  onToggleExpand,
  onEdit,
  onToggle,
  onDelete,
}: {
  code: DiscountCodeData;
  isExpanded: boolean;
  loading: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "2-digit",
        })
      : "—";

  return (
    <>
      <tr className="transition-colors hover:bg-gray-50">
        <td className="px-4 py-3.5">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-2"
          >
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
            <Tag size={14} className="text-violet-500" />
            <span className="font-mono text-sm font-bold text-gray-900">
              {code.code}
            </span>
          </button>
        </td>
        <td className="px-4 py-3.5 text-sm text-gray-700">
          {code.discount_type === "percentage"
            ? `${code.discount_value}%`
            : `$${code.discount_value}`}
        </td>
        <td className="px-4 py-3.5 text-sm text-gray-500">
          {code.current_uses}
          {code.max_uses != null ? ` / ${code.max_uses}` : " / ∞"}
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-500">
          {fmtDate(code.valid_from)} — {code.valid_until ? fmtDate(code.valid_until) : "No expiry"}
        </td>
        <td className="px-4 py-3.5">
          <button
            onClick={onToggle}
            disabled={loading}
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
              code.is_active
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {code.is_active ? "Active" : "Inactive"}
          </button>
        </td>
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={onEdit}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-violet-500"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onToggle}
              disabled={loading}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title={code.is_active ? "Deactivate" : "Activate"}
            >
              {code.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={onDelete}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded: redemption history */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-gray-50 px-4 py-4">
            {code.redemptions.length > 0 ? (
              <div>
                <h4 className="mb-2 text-xs font-semibold text-gray-500">
                  Redemption History ({code.redemptions.length})
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500">
                        <th className="px-3 py-2 text-left font-semibold">
                          Student
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Session ID
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {code.redemptions.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <User size={10} className="text-gray-400" />
                              <span className="text-gray-700">
                                {r.user_name || r.user_email || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign size={10} />
                              {r.amount_discounted}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-400">
                            {r.stripe_checkout_session_id.slice(0, 20)}…
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(r.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400">
                No redemptions yet for this code.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
