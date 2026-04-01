"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  BookOpen,
  FileQuestion,
  Pencil,
  Trash2,
  Plus,
  ChevronUp,
  Upload,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  FolderOpen,
  Save,
  X,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────── */

interface ModuleData {
  id: string;
  title: string;
  module_type: string;
  scorm_entry_path: string | null;
  sort_order: number;
  quiz_pass_score: number | null;
  active: boolean;
}

interface SectionData {
  id: string;
  section_number: number;
  title: string;
  sort_order: number;
  modules: ModuleData[];
}

export interface CourseData {
  id: string;
  slug: string;
  name: string;
  type: string;
  state: string;
  required_hours: number;
  active: boolean;
  enrollmentCount: number;
  sections: SectionData[];
}

/* ── API helper ────────────────────────────────────────────── */

async function apiCall(body: Record<string, unknown>): Promise<{
  ok: boolean;
  message: string;
}> {
  const res = await fetch("/api/admin/courses", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, message: data.message || data.error || "Unknown error" };
}

/* ── Main component ────────────────────────────────────────── */

export function CourseManager({ courses }: { courses: CourseData[] }) {
  const router = useRouter();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  async function doAction(body: Record<string, unknown>) {
    setLoading(true);
    const result = await apiCall(body);
    showToast(result.ok ? "success" : "error", result.message);
    if (result.ok) router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <XCircle size={16} />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          loading={loading}
          doAction={doAction}
          showToast={showToast}
          onRefresh={() => router.refresh()}
        />
      ))}

      {courses.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-400">No courses configured.</p>
        </div>
      )}
    </div>
  );
}

/* ── Course card ───────────────────────────────────────────── */

function CourseCard({
  course,
  loading,
  doAction,
  showToast,
  onRefresh,
}: {
  course: CourseData;
  loading: boolean;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  showToast: (type: "success" | "error", message: string) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingCourse, setEditingCourse] = useState(false);
  const [editName, setEditName] = useState(course.name);
  const [editHours, setEditHours] = useState(course.required_hours);

  async function handleSaveCourse() {
    await doAction({
      action: "update_course",
      courseId: course.id,
      name: editName,
      required_hours: editHours,
    });
    setEditingCourse(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Course header */}
      <div className="flex items-center gap-4 px-6 py-5">
        <button onClick={() => setExpanded(!expanded)}>
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex-1">
          {editingCourse ? (
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-w-[200px] max-w-full flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                Hours:
                <input
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(Number(e.target.value))}
                  className="w-16 rounded border border-gray-200 px-2 py-1 text-xs focus:border-violet-500 focus:outline-none"
                  min={1}
                />
              </label>
              <button
                onClick={handleSaveCourse}
                disabled={loading}
                className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-600 disabled:opacity-50"
              >
                <Save size={12} />
              </button>
              <button
                onClick={() => {
                  setEditingCourse(false);
                  setEditName(course.name);
                  setEditHours(course.required_hours);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-gray-900">
                  {course.name}
                </h3>
                <button
                  onClick={() => setEditingCourse(true)}
                  className="text-gray-400 hover:text-violet-500"
                >
                  <Pencil size={12} />
                </button>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                <span className="font-mono">{course.slug}</span>
                <span>{course.state}</span>
                <span>{course.required_hours}h required</span>
                <span>{course.enrollmentCount} enrolled</span>
              </div>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <button
          onClick={() =>
            doAction({
              action: "update_course",
              courseId: course.id,
              active: !course.active,
            })
          }
          disabled={loading}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            course.active
              ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }`}
        >
          {course.active ? "Active" : "Inactive"}
        </button>
      </div>

      {/* Sections */}
      {expanded && (
        <div className="border-t border-gray-100 px-6 py-4">
          <div className="space-y-4">
            {course.sections.map((section, sIdx) => (
              <SectionBlock
                key={section.id}
                section={section}
                courseSlug={course.slug}
                isFirst={sIdx === 0}
                isLast={sIdx === course.sections.length - 1}
                loading={loading}
                doAction={doAction}
                showToast={showToast}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section block ─────────────────────────────────────────── */

function SectionBlock({
  section,
  courseSlug,
  isFirst,
  isLast,
  loading,
  doAction,
  showToast,
  onRefresh,
}: {
  section: SectionData;
  courseSlug: string;
  isFirst: boolean;
  isLast: boolean;
  loading: boolean;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  showToast: (type: "success" | "error", message: string) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [addingModule, setAddingModule] = useState(false);
  const [newModTitle, setNewModTitle] = useState("");
  const [newModType, setNewModType] = useState<"lesson" | "quiz">("lesson");

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(!expanded)}>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <span className="text-xs font-bold text-gray-400">
          Part {section.section_number}
        </span>

        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded border border-gray-200 px-2 py-1 text-sm font-semibold text-gray-900 focus:border-violet-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    doAction({
                      action: "update_section",
                      sectionId: section.id,
                      title,
                    });
                    setEditingTitle(false);
                  }
                  if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitle(section.title);
                  }
                }}
              />
              <button
                onClick={() => {
                  doAction({
                    action: "update_section",
                    sectionId: section.id,
                    title,
                  });
                  setEditingTitle(false);
                }}
                className="text-violet-500"
              >
                <Save size={12} />
              </button>
              <button
                onClick={() => {
                  setEditingTitle(false);
                  setTitle(section.title);
                }}
                className="text-gray-400"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900">
                {section.title}
              </span>
              <button
                onClick={() => setEditingTitle(true)}
                className="text-gray-400 hover:text-violet-500"
              >
                <Pencil size={10} />
              </button>
            </div>
          )}
        </div>

        <span className="text-xs text-gray-400">
          {section.modules.length} module{section.modules.length !== 1 ? "s" : ""}
        </span>

        {/* Reorder section buttons */}
        <div className="flex gap-0.5">
          <button
            onClick={() =>
              doAction({
                action: "reorder_section",
                sectionId: section.id,
                direction: "up",
              })
            }
            disabled={isFirst || loading}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-20"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() =>
              doAction({
                action: "reorder_section",
                sectionId: section.id,
                direction: "down",
              })
            }
            disabled={isLast || loading}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-20"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Module list */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-2">
          <div className="space-y-1">
            {section.modules.map((mod, mIdx) => (
              <ModuleRow
                key={mod.id}
                module={mod}
                courseSlug={courseSlug}
                isFirst={mIdx === 0}
                isLast={mIdx === section.modules.length - 1}
                loading={loading}
                doAction={doAction}
                showToast={showToast}
                onRefresh={onRefresh}
              />
            ))}
          </div>

          {/* Add module */}
          {addingModule ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-white p-3">
              <input
                value={newModTitle}
                onChange={(e) => setNewModTitle(e.target.value)}
                placeholder="Module title"
                className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-violet-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newModTitle.trim()) {
                    doAction({
                      action: "add_module",
                      sectionId: section.id,
                      title: newModTitle,
                      module_type: newModType,
                    });
                    setAddingModule(false);
                    setNewModTitle("");
                  }
                }}
              />
              <select
                value={newModType}
                onChange={(e) =>
                  setNewModType(e.target.value as "lesson" | "quiz")
                }
                className="rounded border border-gray-200 px-2 py-1.5 text-xs focus:border-violet-500 focus:outline-none"
              >
                <option value="lesson">Lesson</option>
                <option value="quiz">Quiz</option>
              </select>
              <button
                onClick={() => {
                  if (newModTitle.trim()) {
                    doAction({
                      action: "add_module",
                      sectionId: section.id,
                      title: newModTitle,
                      module_type: newModType,
                    });
                    setAddingModule(false);
                    setNewModTitle("");
                  }
                }}
                disabled={!newModTitle.trim() || loading}
                className="rounded bg-violet-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-600 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingModule(false);
                  setNewModTitle("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingModule(true)}
              className="mt-2 flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <Plus size={12} /> Add Module
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Module row ────────────────────────────────────────────── */

function ModuleRow({
  module: mod,
  courseSlug,
  isFirst,
  isLast,
  loading,
  doAction,
  showToast,
  onRefresh,
}: {
  module: ModuleData;
  courseSlug: string;
  isFirst: boolean;
  isLast: boolean;
  loading: boolean;
  doAction: (body: Record<string, unknown>) => Promise<void>;
  showToast: (type: "success" | "error", message: string) => void;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(mod.title);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("moduleId", mod.id);
    formData.append("courseSlug", courseSlug);

    try {
      const res = await fetch("/api/admin/courses/upload-scorm", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Upload failed");
      } else {
        showToast("success", data.message);
        onRefresh();
      }
    } catch {
      showToast("error", "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white ${
        !mod.active ? "opacity-50" : ""
      }`}
    >
      {/* Type icon */}
      {mod.module_type === "quiz" ? (
        <FileQuestion size={14} className="flex-shrink-0 text-amber-500" />
      ) : (
        <BookOpen size={14} className="flex-shrink-0 text-violet-500" />
      )}

      {/* Title */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-violet-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && editTitle.trim()) {
                  doAction({
                    action: "update_module",
                    moduleId: mod.id,
                    title: editTitle,
                  });
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditing(false);
                  setEditTitle(mod.title);
                }
              }}
            />
            <button
              onClick={() => {
                doAction({
                  action: "update_module",
                  moduleId: mod.id,
                  title: editTitle,
                });
                setEditing(false);
              }}
              className="text-violet-500"
            >
              <Save size={12} />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditTitle(mod.title);
              }}
              className="text-gray-400"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-medium text-gray-700">
              {mod.title}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="flex-shrink-0 text-gray-400 hover:text-violet-500"
            >
              <Pencil size={10} />
            </button>
          </div>
        )}

        {/* SCORM path */}
        {mod.scorm_entry_path && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-mono text-gray-400">
            <FolderOpen size={8} />
            {mod.scorm_entry_path}
          </p>
        )}
      </div>

      {/* Badges */}
      <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-400">
        {mod.module_type}
      </span>

      {mod.module_type === "quiz" && mod.quiz_pass_score != null && (
        <span className="flex-shrink-0 text-[10px] text-gray-400">
          {mod.quiz_pass_score}%
        </span>
      )}

      {/* Upload SCORM */}
      {mod.module_type === "lesson" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-violet-100 hover:text-violet-500 disabled:opacity-30"
            title="Upload SCORM package"
          >
            {uploading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
          </button>
        </>
      )}

      {/* Active toggle */}
      <button
        onClick={() =>
          doAction({
            action: "toggle_module_active",
            moduleId: mod.id,
            active: !mod.active,
          })
        }
        disabled={loading}
        className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title={mod.active ? "Deactivate" : "Activate"}
      >
        {mod.active ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      {/* Reorder */}
      <div className="flex flex-shrink-0 gap-0.5">
        <button
          onClick={() =>
            doAction({
              action: "reorder_module",
              moduleId: mod.id,
              direction: "up",
            })
          }
          disabled={isFirst || loading}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-20"
        >
          <ChevronUp size={12} />
        </button>
        <button
          onClick={() =>
            doAction({
              action: "reorder_module",
              moduleId: mod.id,
              direction: "down",
            })
          }
          disabled={isLast || loading}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-20"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        disabled={loading}
        className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
      >
        <Trash2 size={12} />
      </button>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-gray-900">
              Delete Module?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Delete &ldquo;{mod.title}&rdquo;? This will also remove all
              student progress for this module.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  doAction({ action: "remove_module", moduleId: mod.id });
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
