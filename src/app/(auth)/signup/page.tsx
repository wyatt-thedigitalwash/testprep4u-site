"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signup } from "@/lib/supabase-auth";

const US_STATES = [
  { value: "FL", label: "Florida" },
  // Additional states added as courses expand
] as const;

function SignupForm() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const course = searchParams.get("course");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Build query string to preserve plan context in links
  const planParams =
    plan && course ? `?plan=${plan}&course=${course}` : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    // Build redirect URL so email confirmation lands on pricing with auto-checkout
    let redirectTo: string | undefined;
    if (plan && course) {
      redirectTo = `/pricing?plan=${plan}&course=${course}&autoCheckout=true`;
      // localStorage fallback in case email redirect doesn't preserve params
      localStorage.setItem(
        "pendingCheckout",
        JSON.stringify({ plan, course })
      );
    }

    const { error: authError } = await signup(
      email,
      password,
      fullName,
      state,
      redirectTo
    );
    if (authError) {
      if (authError.message === "EMAIL_EXISTS") {
        setEmailExists(true);
      } else {
        setError(authError.message);
      }
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <Link href="/" className="mb-8 flex justify-center">
        <Image
          src="/assets/testprep4u-logo-light.svg"
          alt="TestPrep4U"
          width={160}
          height={34}
          className="rounded-lg bg-navy p-3"
        />
      </Link>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-light">
              <svg
                className="h-6 w-6 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-navy">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              We sent a confirmation link to{" "}
              <span className="font-medium text-gray-700">{email}</span>.
              Click the link to activate your account.
            </p>
            <Link
              href={`/login${planParams}`}
              className="mt-6 inline-block text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-navy">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Get started with your exam prep today.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Alex Johnson"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailExists) setEmailExists(false);
                  }}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700"
                >
                  State
                </label>
                <select
                  id="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="" disabled>
                    Select your state
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {emailExists && (
                <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
                  An account with this email already exists.{" "}
                  <Link
                    href={`/login${planParams}`}
                    className="font-medium underline hover:text-error/80"
                  >
                    Sign in instead
                  </Link>
                </div>
              )}

              {error && !emailExists && (
                <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-8 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Sign in link */}
      {!success && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href={`/login${planParams}`}
            className="font-medium text-blue-500 hover:text-blue-600"
          >
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      <Suspense fallback={<div className="w-full max-w-md animate-pulse space-y-4"><div className="h-10 rounded bg-gray-200" /><div className="h-96 rounded-xl bg-gray-200" /></div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
