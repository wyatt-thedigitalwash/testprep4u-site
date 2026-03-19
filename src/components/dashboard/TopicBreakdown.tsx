import type { TopicArea } from "@/lib/mock-data";

interface TopicBreakdownProps {
  topics: TopicArea[];
}

const statusBadge = {
  strong: { bg: "bg-success-light", text: "text-success", label: "Strong" },
  moderate: { bg: "bg-warning-light", text: "text-warning", label: "Moderate" },
  weak: { bg: "bg-error-light", text: "text-error", label: "Weak" },
};

const barColor = {
  strong: "bg-success",
  moderate: "bg-warning",
  weak: "bg-error",
};

export function TopicBreakdown({ topics }: TopicBreakdownProps) {
  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        No topic data available yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-navy">
        Topic Breakdown
      </h3>
      <div className="space-y-4">
        {topics.map((topic) => {
          const badge = statusBadge[topic.status];
          return (
            <div key={topic.topic}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-navy">
                    {topic.topic}
                  </span>
                  <span className="text-xs text-gray-400">{topic.weight}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-navy">
                    {topic.score}%
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${barColor[topic.status]} transition-all duration-500`}
                  style={{ width: `${topic.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
