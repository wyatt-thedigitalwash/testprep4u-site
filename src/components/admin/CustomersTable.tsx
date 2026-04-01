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
  Users,
  DollarSign,
  Tag,
  TrendingUp,
} from "lucide-react";
import type { CustomerRow } from "@/app/api/admin/customers/route";

/* ── Types ─────────────────────────────────────────────────── */

interface Stats {
  totalCustomers: number;
  totalGross: number;
  totalNet: number;
  totalDiscount: number;
}

interface ApiResponse {
  rows: CustomerRow[];
  total: number;
  stats: Stats;
}

interface Filters {
  pk: string;
  sk: string;
  course: string;
  state: string;
  tier: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  pk: "",
  sk: "",
  course: "",
  state: "",
  tier: "",
  from: "",
  to: "",
};

const PAGE_SIZE = 50;

/* ── Helpers ───────────────────────────────────────────────── */

function fmtCurrency(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v < 0
    ? `-$${Math.abs(v).toFixed(2)}`
    : `$${v.toFixed(2)}`;
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

/* ── Columns config ────────────────────────────────────────── */

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
  render: (r: CustomerRow) => string;
}

const COLUMNS: Column[] = [
  { key: "primary_key", label: "PK", sortable: true, className: "w-16", render: (r) => String(r.primary_key) },
  { key: "secondary_key", label: "SK", sortable: true, className: "w-16", render: (r) => String(r.secondary_key) },
  { key: "customer_name", label: "Customer Name", sortable: true, render: (r) => r.customer_name || "—" },
  { key: "billing_street", label: "Street", sortable: false, render: (r) => r.billing_street || "—" },
  { key: "billing_city", label: "City", sortable: false, render: (r) => r.billing_city || "—" },
  { key: "billing_state", label: "St", sortable: false, className: "w-12", render: (r) => r.billing_state || "—" },
  { key: "billing_zip", label: "Zip", sortable: false, className: "w-16", render: (r) => r.billing_zip || "—" },
  { key: "phone", label: "Phone", sortable: false, render: (r) => r.phone || "—" },
  { key: "email", label: "Email", sortable: true, render: (r) => r.email },
  { key: "course_name", label: "Course", sortable: true, render: (r) => r.course_name || "—" },
  { key: "course_state", label: "Course St", sortable: true, className: "w-16", render: (r) => r.course_state || "—" },
  { key: "plan_tier", label: "Program", sortable: true, className: "w-20", render: (r) => r.plan_tier ? r.plan_tier.charAt(0).toUpperCase() + r.plan_tier.slice(1) : "—" },
  { key: "referral_code", label: "Ref Code", sortable: true, className: "w-18", render: (r) => r.referral_code != null ? String(r.referral_code) : "—" },
  { key: "enrolled_at", label: "Date", sortable: true, className: "w-24", render: (r) => fmtDate(r.enrolled_at) },
  { key: "gross_amount", label: "Gross", sortable: true, className: "w-20 text-right", render: (r) => fmtCurrency(r.gross_amount) },
  { key: "discount_amount", label: "Discount", sortable: false, className: "w-20 text-right", render: (r) => fmtCurrency(r.discount_amount) },
  { key: "tax_amount", label: "Tax", sortable: false, className: "w-18 text-right", render: (r) => fmtCurrency(r.tax_amount) },
  { key: "fee_amount", label: "Fees", sortable: false, className: "w-18 text-right", render: (r) => fmtCurrency(r.fee_amount) },
  { key: "net_amount", label: "Net", sortable: true, className: "w-20 text-right", render: (r) => fmtCurrency(r.net_amount) },
];

/* ── Main component ────────────────────────────────────────── */

export function CustomersTable() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState("primary_key");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.pk) params.set("pk", filters.pk);
    if (filters.sk) params.set("sk", filters.sk);
    if (filters.course) params.set("course", filters.course);
    if (filters.state) params.set("state", filters.state);
    if (filters.tier) params.set("tier", filters.tier);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", sort);
    params.set("dir", dir);
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/admin/customers?${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filters, sort, dir, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSort(key: string) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir("asc");
    }
    setPage(1);
  }

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  async function handleExport(format: "csv" | "xlsx") {
    setExporting(format);
    const params = new URLSearchParams();
    if (filters.pk) params.set("pk", filters.pk);
    if (filters.sk) params.set("sk", filters.sk);
    if (filters.course) params.set("course", filters.course);
    if (filters.state) params.set("state", filters.state);
    if (filters.tier) params.set("tier", filters.tier);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set("sort", sort);
    params.set("dir", dir);
    params.set("format", format);

    try {
      const res = await fetch(`/api/admin/customers?${params}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-${new Date().toISOString().split("T")[0]}.${format === "xlsx" ? "csv" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  }

  const stats = data?.stats || { totalCustomers: 0, totalGross: 0, totalNet: 0, totalDiscount: 0 };
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Customers" value={String(stats.totalCustomers)} color="bg-violet-100 text-violet-600" />
        <StatCard icon={DollarSign} label="Gross Revenue" value={`$${stats.totalGross.toFixed(2)}`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Net Revenue" value={`$${stats.totalNet.toFixed(2)}`} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Tag} label="Total Discounts" value={`$${Math.abs(stats.totalDiscount).toFixed(2)}`} color="bg-amber-100 text-amber-600" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <FilterInput
            icon={<Search size={14} />}
            placeholder="Primary Key"
            value={filters.pk}
            onChange={(v) => updateFilter("pk", v)}
          />
          <FilterInput
            icon={<Search size={14} />}
            placeholder="Secondary Key"
            value={filters.sk}
            onChange={(v) => updateFilter("sk", v)}
          />
          <FilterSelect
            placeholder="Course"
            value={filters.course}
            onChange={(v) => updateFilter("course", v)}
            options={[
              { value: "life", label: "Life" },
              { value: "health", label: "Health" },
              { value: "combined", label: "Combined" },
            ]}
          />
          <FilterSelect
            placeholder="State"
            value={filters.state}
            onChange={(v) => updateFilter("state", v)}
            options={[{ value: "FL", label: "Florida" }]}
          />
          <FilterSelect
            placeholder="Program"
            value={filters.tier}
            onChange={(v) => updateFilter("tier", v)}
            options={[
              { value: "essentials", label: "Essentials" },
              { value: "pro", label: "Pro" },
              { value: "premium", label: "Premium" },
            ]}
          />
          <div>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter("from", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              title="From date"
            />
          </div>
          <div>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter("to", e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              title="To date"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
            className="text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            Clear filters
          </button>
          <div className="flex gap-2">
            <ExportBtn
              label="CSV"
              loading={exporting === "csv"}
              onClick={() => handleExport("csv")}
            />
            <ExportBtn
              label="Excel"
              loading={exporting === "xlsx"}
              onClick={() => handleExport("xlsx")}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 ${col.className || ""} ${col.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""}`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sort === col.key && (
                        dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !data ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-12 text-center">
                    <Loader2 size={20} className="mx-auto animate-spin text-violet-500" />
                  </td>
                </tr>
              ) : (data?.rows || []).length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-3 py-12 text-center text-sm text-gray-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                (data?.rows || []).map((row, i) => (
                  <tr key={`${row.primary_key}-${row.enrolled_at}-${i}`} className="transition-colors hover:bg-gray-50">
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap px-3 py-2.5 text-xs text-gray-700 ${col.className || ""}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              {data?.total || 0} rows · Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading overlay for re-fetches */}
      {loading && data && (
        <div className="flex justify-center">
          <Loader2 size={16} className="animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="font-display text-lg font-bold text-gray-900">{value}</p>
          <p className="text-[10px] text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FilterInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
    </div>
  );
}

function FilterSelect({
  placeholder,
  value,
  onChange,
  options,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ExportBtn({
  label,
  loading,
  onClick,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {label}
    </button>
  );
}
