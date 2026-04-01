import { createAdminClient } from "@/lib/supabase/server";
import { CourseManager, type CourseData } from "@/components/admin/CourseManager";

export default async function AdminCoursesPage() {
  const supabase = createAdminClient();

  // Fetch all courses with sections and modules
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, name, type, state, required_hours, active")
    .order("state")
    .order("type");

  // Fetch sections and modules for all courses
  const courseIds = (courses || []).map((c) => c.id);
  let sectionsMap = new Map<
    string,
    Array<{
      id: string;
      course_id: string;
      section_number: number;
      title: string;
      sort_order: number;
    }>
  >();
  let modulesMap = new Map<
    string,
    Array<{
      id: string;
      section_id: string;
      title: string;
      module_type: string;
      scorm_entry_path: string | null;
      sort_order: number;
      quiz_pass_score: number | null;
      active: boolean;
    }>
  >();

  if (courseIds.length > 0) {
    const { data: sections } = await supabase
      .from("course_sections")
      .select("id, course_id, section_number, title, sort_order")
      .in("course_id", courseIds)
      .order("sort_order");

    for (const s of sections || []) {
      const list = sectionsMap.get(s.course_id) || [];
      list.push(s);
      sectionsMap.set(s.course_id, list);
    }

    const sectionIds = (sections || []).map((s) => s.id);
    if (sectionIds.length > 0) {
      const { data: modules } = await supabase
        .from("course_modules")
        .select(
          "id, section_id, title, module_type, scorm_entry_path, sort_order, quiz_pass_score, active"
        )
        .in("section_id", sectionIds)
        .order("sort_order");

      for (const m of modules || []) {
        const list = modulesMap.get(m.section_id) || [];
        list.push(m);
        modulesMap.set(m.section_id, list);
      }
    }
  }

  // Enrollment counts per course
  let enrollmentCounts = new Map<string, number>();
  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("status", "active");

    for (const e of enrollments || []) {
      enrollmentCounts.set(
        e.course_id,
        (enrollmentCounts.get(e.course_id) || 0) + 1
      );
    }
  }

  // Assemble data
  const courseData: CourseData[] = (courses || []).map((course) => ({
    id: course.id,
    slug: course.slug,
    name: course.name,
    type: course.type,
    state: course.state,
    required_hours: course.required_hours,
    active: course.active,
    enrollmentCount: enrollmentCounts.get(course.id) || 0,
    sections: (sectionsMap.get(course.id) || []).map((section) => ({
      id: section.id,
      section_number: section.section_number,
      title: section.title,
      sort_order: section.sort_order,
      modules: (modulesMap.get(section.id) || []).map((mod) => ({
        id: mod.id,
        title: mod.title,
        module_type: mod.module_type,
        scorm_entry_path: mod.scorm_entry_path,
        sort_order: mod.sort_order,
        quiz_pass_score: mod.quiz_pass_score,
        active: mod.active,
      })),
    })),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Courses
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage courses, sections, modules, and SCORM content.
        </p>
      </div>
      <CourseManager courses={courseData} />
    </div>
  );
}
