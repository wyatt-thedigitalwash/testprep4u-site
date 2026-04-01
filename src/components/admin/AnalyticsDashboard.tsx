"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  DollarSign,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────── */

interface AnalyticsData {
  stats: {
    totalStudents: number;
    completionRate: number;
    avgFinalScore: number;
    avgSeatTimeSeconds: number;
    avgTimeToCompleteSeconds: number;
    totalRevenue: number;
  };
  enrollmentTrend: Array<{ date: string }>;
  revenueByMonth: Array<{ month: string; amount: number }>;
  passRates: Array<{
    name: string;
    title: string;
    passed: number;
    total: number;
    rate: number;
  }>;
  funnel: Array<{ name: string; value: number }>;
}

type TimeGranularity = "daily" | "weekly" | "monthly";

/* ── Helpers ───────────────────────────────────────────────── */

function formatHours(seconds: number): string {
  const h = Math.round((seconds / 3600) * 10) / 10;
  return `${h}h`;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function aggregateEnrollments(
  raw: Array<{ date: string }>,
  granularity: TimeGranularity
): Array<{ label: string; count: number }> {
  const buckets = new Map<string, number>();

  for (const { date } of raw) {
    let key: string;
    if (granularity === "daily") {
      key = date;
    } else if (granularity === "weekly") {
      key = getWeekKey(date);
    } else {
      key = getMonthKey(date);
    }
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => {
      let label = key;
      if (granularity === "daily") {
        const d = new Date(key);
        label = `${d.getMonth() + 1}/${d.getDate()}`;
      } else if (granularity === "monthly") {
        const [y, m] = key.split("-");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const idx = parseInt(m, 10) - 1;
        label = idx >= 0 && idx < 12 ? `${months[idx]} ${y.slice(2)}` : key;
      }
      return { label, count };
    });
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = parseInt(m, 10) - 1;
  return idx >= 0 && idx < 12 ? `${months[idx]} ${y.slice(2)}` : month;
}

/* ── Main component ────────────────────────────────────────── */

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<TimeGranularity>("monthly");

  // Default: last 12 months
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: dateFrom, to: dateTo });
      const res = await fetch(`/api/admin/analytics?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        Failed to load analytics data.
      </p>
    );
  }

  const enrollmentChartData = aggregateEnrollments(
    data.enrollmentTrend,
    granularity
  );
  const revenueChartData = data.revenueByMonth.map((r) => ({
    label: formatMonthLabel(r.month),
    amount: r.amount,
  }));

  const funnelMax = data.funnel[0]?.value || 1;

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <Calendar size={16} className="text-gray-400" />
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-violet-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 focus:border-violet-500 focus:outline-none"
          />
        </label>
        {loading && (
          <Loader2 size={14} className="animate-spin text-gray-400" />
        )}
      </div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total Students"
          value={String(data.stats.totalStudents)}
          color="bg-violet-100 text-violet-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${data.stats.completionRate}%`}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={Target}
          label="Avg Final Exam Score"
          value={
            data.stats.avgFinalScore > 0
              ? `${data.stats.avgFinalScore}%`
              : "—"
          }
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Clock}
          label="Avg Seat Time"
          value={formatHours(data.stats.avgSeatTimeSeconds)}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={BarChart3}
          label="Avg Time to Complete"
          value={
            data.stats.avgTimeToCompleteSeconds > 0
              ? formatHours(data.stats.avgTimeToCompleteSeconds)
              : "—"
          }
          color="bg-sky-100 text-sky-600"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue to Date"
          value={`$${data.stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
          color="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Enrollment trends chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-gray-900">
            Enrollment Trends
          </h3>
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
            {(["daily", "weekly", "monthly"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  granularity === g
                    ? "bg-violet-500 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {enrollmentChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={enrollmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#8b5cf6" }}
                activeDot={{ r: 5 }}
                name="Enrollments"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-12 text-center text-sm text-gray-400">
            No enrollment data for this period.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-sm font-semibold text-gray-900">
            Revenue by Month
          </h3>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">
              No revenue data available.
            </p>
          )}
        </div>

        {/* Pass rates chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-sm font-semibold text-gray-900">
            Pass Rates by Section
          </h3>
          {data.passRates.some((p) => p.total > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.passRates} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value, _name, props) => {
                    const payload = props?.payload as
                      | { passed: number; total: number }
                      | undefined;
                    return [
                      `${value}% (${payload?.passed ?? 0}/${payload?.total ?? 0})`,
                      "Pass Rate",
                    ];
                  }}
                />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {data.passRates.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.rate >= 80
                          ? "#10b981"
                          : entry.rate >= 70
                            ? "#f59e0b"
                            : entry.total === 0
                              ? "#e2e8f0"
                              : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">
              No exam data yet.
            </p>
          )}
        </div>
      </div>

      {/* Completion funnel */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-gray-900">
          Completion Funnel
        </h3>
        {data.funnel.some((f) => f.value > 0) ? (
          <div className="space-y-3">
            {data.funnel.map((step, i) => {
              const pct =
                funnelMax > 0
                  ? Math.round((step.value / funnelMax) * 100)
                  : 0;
              const isLast = i === data.funnel.length - 1;
              return (
                <div key={step.name} className="flex items-center gap-4">
                  <span className="w-20 text-right text-xs font-medium text-gray-500">
                    {step.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-8 rounded-lg bg-gray-100">
                      <div
                        className={`flex h-8 items-center rounded-lg px-3 text-xs font-bold text-white transition-all ${
                          isLast ? "bg-emerald-500" : "bg-violet-500"
                        }`}
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                        }}
                      >
                        {step.value}
                      </div>
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs text-gray-400">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            No enrollment data yet.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────── */

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-gray-900">
            {value}
          </p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
