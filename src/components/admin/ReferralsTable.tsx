"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  DollarSign,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { ReferralRow } from "@/app/api/admin/referrals/route";

/* ── Types ─────────────────────────────────────────────────── */

interface Stats {
  totalReferrals: number;
  pendingCommission: number;
  paidCommission: number;
  totalGrossProfit: number;
}

interface ApiResponse {
  rows: ReferralRow[];
  total: number;
  stats: Stats;
}

interface Filters {
  sk: string;
  pk: string;
  status: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { sk: "", pk: "", status: "", from: "", to: "" };
const PAGE_SIZE = 50;

/* ── Helpers ───────────────────────────────────────────────── */

function fmtCurrency(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

/* ── Main component ────────────────────────────────────────── */

export function ReferralsTable() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState("redemption_date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.sk) params.set("sk", filters.sk);
    if (filters.pk) params.set("pk", filters.pk);
    if (filters.status) params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", sort);
    params.set("dir", dir);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/admin/referrals?${params}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [filters, sort, dir, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSort(key: string) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(key); setDir("asc"); }
    setPage(1);
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    const params = new URLSearchParams();
    if (filters.sk) params.set("sk", filters.sk);
    if (filters.pk) params.set("pk", filters.pk);
    if (filters.status) params.set("status", filters.status);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", sort);
    params.set("dir", dir);
    params.set("format", "csv");

    try {
      const res = await fetch(`/api/admin/referrals?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `referrals-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handleStatusChange(
    payoutId: string,
    action: "approve" | "mark_paid"
  ) {
    const promptMsg =
      action === "approve"
        ? "Enter manager name for approval:"
        : "Enter payor name:";
    const name = window.prompt(promptMsg);
    if (name === null) return; // cancelled

    setActionLoading(payoutId);

    // Optimistic update
    if (data) {
      setData({
        ...data,
        rows: data.rows.map((r) =>
          r.payout_id === payoutId
            ? {
                ...r,
                paid_status: action === "approve" ? "approved" : "paid",
                ...(action === "approve"
                  ? { manager_approval_name: name || "Admin" }
                  : { payor_name: name || "Admin", paid_date: new Date().toISOString() }),
              }
            : r
        ),
      });
    }

    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action, name: name || "Admin" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showToast("success", result.message);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Failed");
      fetchData(); // revert optimistic update
    } finally {
      setActionLoading(null);
    }
  }

  const stats = data?.stats || { totalReferrals: 0, pendingCommission: 0, paidCommission: 0, totalGrossProfit: 0 };
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${
          toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <CheckCircle2 size={16} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={GitBranch} label="Total Referrals" value={String(stats.totalReferrals)} color="bg-violet-100 text-violet-600" />
        <StatCard icon={Clock} label="Pending Commission" value={`$${stats.pendingCommission.toFixed(2)}`} color="bg-amber-100 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Paid Commission" value={`$${stats.paidCommission.toFixed(2)}`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Gross Profit" value={`$${stats.totalGrossProfit.toFixed(2)}`} color="bg-blue-100 text-blue-600" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterInput icon={<Search size={14} />} placeholder="Secondary Key" value={filters.sk} onChange={(v) => updateFilter("sk", v)} />
          <FilterInput icon={<Search size={14} />} placeholder="Customer PK" value={filters.pk} onChange={(v) => updateFilter("pk", v)} />
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
          <input type="date" value={filters.from} onChange={(e) => updateFilter("from", e.target.value)} title="From date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
          <input type="date" value={filters.to} onChange={(e) => updateFilter("to", e.target.value)} title="To date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }} className="text-xs font-medium text-gray-400 hover:text-gray-600">
            Clear filters
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {COLUMNS.map((col) => (
                  <th key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 ${col.className || ""} ${col.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}>
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sort === col.key && (dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </span>
                  </th>
                ))}
                <th className="whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !data ? (
                <tr><td colSpan={COLUMNS.length + 1} className="px-3 py-12 text-center"><Loader2 size={20} className="mx-auto animate-spin text-violet-500" /></td></tr>
              ) : (data?.rows || []).length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} className="px-3 py-12 text-center text-sm text-gray-400">No referrals found.</td></tr>
              ) : (
                (data?.rows || []).map((row) => (
                  <tr key={row.payout_id} className="transition-colors hover:bg-gray-50">
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={`whitespace-nowrap px-3 py-2.5 text-xs text-gray-700 ${col.className || ""}`}>
                        {col.render(row)}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <StatusActions
                        row={row}
                        loading={actionLoading === row.payout_id}
                        onApprove={() => handleStatusChange(row.payout_id, "approve")}
                        onMarkPaid={() => handleStatusChange(row.payout_id, "mark_paid")}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">{data?.total || 0} rows · Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {loading && data && (
        <div className="flex justify-center"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
      )}
    </div>
  );
}

/* ── Columns config ────────────────────────────────────────── */

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
  render: (r: ReferralRow) => React.ReactNode;
}

const COLUMNS: Column[] = [
  { key: "partner_secondary_key", label: "SK", sortable: true, className: "w-14", render: (r) => String(r.partner_secondary_key) },
  { key: "partner_name", label: "Partner", sortable: true, render: (r) => r.partner_name },
  { key: "partner_primary_key", label: "Partner PK", sortable: false, className: "w-16", render: (r) => String(r.partner_primary_key) },
  { key: "customer_primary_key", label: "Cust PK", sortable: true, className: "w-16", render: (r) => String(r.customer_primary_key) },
  { key: "customer_name", label: "Customer", sortable: true, render: (r) => r.customer_name },
  { key: "redemption_date", label: "Date", sortable: true, className: "w-24", render: (r) => fmtDate(r.redemption_date) },
  { key: "gross_amount", label: "Gross", sortable: true, className: "w-20 text-right", render: (r) => fmtCurrency(r.gross_amount) },
  { key: "discount_amount", label: "Discount", sortable: false, className: "w-20 text-right", render: (r) => fmtCurrency(r.discount_amount) },
  { key: "tax_amount", label: "Tax", sortable: false, className: "w-16 text-right", render: (r) => fmtCurrency(r.tax_amount) },
  { key: "fee_amount", label: "Fees", sortable: false, className: "w-16 text-right", render: (r) => fmtCurrency(r.fee_amount) },
  { key: "net_amount", label: "Net", sortable: true, className: "w-20 text-right", render: (r) => fmtCurrency(r.net_amount) },
  { key: "commission_amount", label: "Commission", sortable: true, className: "w-22 text-right", render: (r) => fmtCurrency(-r.commission_amount) },
  { key: "gross_profit", label: "Gross Profit", sortable: true, className: "w-22 text-right", render: (r) => fmtCurrency(r.gross_profit) },
  {
    key: "paid_status", label: "Paid", sortable: true, className: "w-16",
    render: (r) => (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        r.paid_status === "paid" ? "bg-emerald-100 text-emerald-600"
          : r.paid_status === "approved" ? "bg-blue-100 text-blue-600"
          : "bg-amber-100 text-amber-600"
      }`}>
        {r.paid_status === "paid" ? "Yes" : "No"}
      </span>
    ),
  },
  { key: "paid_date", label: "Paid Date", sortable: false, className: "w-24", render: (r) => fmtDate(r.paid_date) },
  { key: "payor_name", label: "Payor", sortable: false, render: (r) => r.payor_name || "—" },
  { key: "manager_approval_name", label: "Mgr Approval", sortable: false, render: (r) => r.manager_approval_name || "—" },
];

/* ── Sub-components ────────────────────────────────────────── */

function StatusActions({
  row,
  loading,
  onApprove,
  onMarkPaid,
}: {
  row: ReferralRow;
  loading: boolean;
  onApprove: () => void;
  onMarkPaid: () => void;
}) {
  if (loading) {
    return <Loader2 size={12} className="animate-spin text-gray-400" />;
  }

  if (row.paid_status === "pending") {
    return (
      <button onClick={onApprove}
        className="rounded bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-600 transition-colors hover:bg-violet-200">
        Approve
      </button>
    );
  }

  if (row.paid_status === "approved") {
    return (
      <button onClick={onMarkPaid}
        className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-200">
        Mark Paid
      </button>
    );
  }

  return <span className="text-[10px] text-gray-400">Complete</span>;
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof GitBranch; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon size={16} /></div>
        <div>
          <p className="font-display text-lg font-bold text-gray-900">{value}</p>
          <p className="text-[10px] text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FilterInput({ icon, placeholder, value, onChange }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
    </div>
  );
}
