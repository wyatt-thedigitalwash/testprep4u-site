"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";

const US_STATES = [
  { value: "FL", label: "Florida" },
] as const;

interface ProfileEditorProps {
  fullName: string;
  email: string;
  phone: string;
  state: string;
}

export function ProfileEditor({
  fullName: initialName,
  email,
  phone: initialPhone,
  state: initialState,
}: ProfileEditorProps) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [state, setState] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Track saved values so display updates after save
  const [savedName, setSavedName] = useState(initialName);
  const [savedPhone, setSavedPhone] = useState(initialPhone);
  const [savedState, setSavedState] = useState(initialState);

  function handleCancel() {
    setFullName(savedName);
    setPhone(savedPhone);
    setState(savedState);
    setEditing(false);
    setError("");
    setSuccess(false);
  }

  async function handleSave() {
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          state,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to save changes.");
        setSaving(false);
        return;
      }

      setSavedName(fullName.trim());
      setSavedPhone(phone.trim());
      setSavedState(state);
      setSuccess(true);
      setEditing(false);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  const stateLabel =
    US_STATES.find((s) => s.value === (editing ? state : savedState))?.label ||
    (editing ? state : savedState);

  const inputClass =
    "block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <>
      {/* Header with edit toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
            <svg
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-navy">
            Profile
          </h3>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setSuccess(false); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-blue-500 hover:text-blue-500"
          >
            <Pencil size={12} />
            Edit Profile
          </button>
        )}
        {editing && (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
          >
            <X size={12} />
            Cancel
          </button>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div className="mt-3 rounded-lg bg-success-light px-4 py-2.5 text-sm text-success">
          Profile updated successfully.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 rounded-lg bg-error-light px-4 py-2.5 text-sm text-error">
          {error}
        </div>
      )}

      {/* Fields */}
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <dt className="text-gray-500">Name</dt>
          <dd className="font-medium text-navy">
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`${inputClass} w-48 text-right`}
              />
            ) : (
              savedName
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium text-navy">{email}</dd>
        </div>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <dt className="text-gray-500">Phone</dt>
          <dd className="font-medium text-navy">
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className={`${inputClass} w-48 text-right`}
              />
            ) : (
              savedPhone || <span className="text-gray-400">Not set</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">State</dt>
          <dd className="font-medium text-navy">
            {editing ? (
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={`${inputClass} w-48 text-right`}
              >
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : (
              stateLabel
            )}
          </dd>
        </div>
      </dl>

      {/* Save button */}
      {editing && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-6 py-2 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </>
  );
}
