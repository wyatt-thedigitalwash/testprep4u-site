import { Clock, Target, BookOpen } from "lucide-react";
import { stats } from "@/lib/mock-data";

const statItems = [
  {
    label: "Study Hours",
    value: `${stats.studyHours}hrs`,
    icon: Clock,
    color: "bg-blue-100 text-blue-500",
  },
  {
    label: "Practice Exam Avg",
    value: `${stats.practiceExamAvg}%`,
    icon: Target,
    color: "bg-success-light text-success",
  },
  {
    label: "Courses Enrolled",
    value: String(stats.coursesEnrolled),
    icon: BookOpen,
    color: "bg-warning-light text-warning",
  },
];

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}
            >
              <stat.icon size={20} />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-navy">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
