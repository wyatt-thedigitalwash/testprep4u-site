import { courses } from "@/lib/mock-data";
import { CourseCard } from "@/components/dashboard/CourseCard";

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">
          My Courses
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Your enrolled courses and progress.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
