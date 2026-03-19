import { ShieldCheck } from "lucide-react";
import { demoStudent, courses } from "@/lib/mock-data";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { CourseCard } from "@/components/dashboard/CourseCard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">
          Welcome back, {demoStudent.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your progress.
        </p>
      </div>

      {/* Milestone callout */}
      <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-100/40 p-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          <ShieldCheck size={22} className="text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-navy">
            Upcoming Milestone
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            Score 80%+ on 3 practice exams to qualify for the Pass Guarantee.
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid />

      {/* Enrolled courses */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold text-navy">
          Your Courses
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
