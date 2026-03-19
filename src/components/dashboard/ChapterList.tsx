import { Check, Circle, Lock } from "lucide-react";
import type { Chapter } from "@/lib/mock-data";

interface ChapterListProps {
  chapters: Chapter[];
}

const statusConfig = {
  completed: {
    icon: Check,
    iconClass: "text-success",
    bgClass: "bg-success-light",
    label: "Completed",
  },
  in_progress: {
    icon: Circle,
    iconClass: "text-blue-500",
    bgClass: "bg-blue-100",
    label: "In Progress",
  },
  not_started: {
    icon: Circle,
    iconClass: "text-gray-400",
    bgClass: "bg-gray-100",
    label: "Not Started",
  },
  locked: {
    icon: Lock,
    iconClass: "text-gray-300",
    bgClass: "bg-gray-100",
    label: "Locked",
  },
};

export function ChapterList({ chapters }: ChapterListProps) {
  return (
    <div className="space-y-2">
      {chapters.map((chapter) => {
        const config = statusConfig[chapter.status];
        const isLocked = chapter.status === "locked";

        return (
          <div
            key={chapter.number}
            className={`flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 ${
              isLocked ? "opacity-60" : ""
            }`}
          >
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
            >
              <config.icon size={16} className={config.iconClass} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">
                  {String(chapter.number).padStart(2, "0")}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isLocked ? "text-gray-400" : "text-navy"
                  }`}
                >
                  {chapter.title}
                </span>
              </div>
            </div>

            <span className="flex-shrink-0 text-xs text-gray-400">
              {chapter.duration}
            </span>

            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                chapter.status === "completed"
                  ? "bg-success-light text-success"
                  : chapter.status === "in_progress"
                    ? "bg-blue-100 text-blue-500"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
