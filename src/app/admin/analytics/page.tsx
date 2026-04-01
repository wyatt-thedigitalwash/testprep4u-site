import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Analytics
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Platform performance and student insights.
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
