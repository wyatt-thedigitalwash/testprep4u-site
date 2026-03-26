"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/lib/supabase-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const course = searchParams.get("course");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Build query string to preserve plan context in links
  const planParams =
    plan && course ? `?plan=${plan}&course=${course}` : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await login(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // If plan context exists, go straight to pricing with auto-checkout
      if (plan && course) {
        router.push(
          `/pricing?plan=${plan}&course=${course}&autoCheckout=true`
        );
        router.refresh();
        return;
      }

      // No plan context — check if user has active enrollments
      try {
        const res = await fetch("/api/user/has-enrollments");
        const data = await res.json();
        router.push(data.hasEnrollments ? "/dashboard" : "/pricing");
      } catch {
        // Fallback to dashboard on error
        router.push("/dashboard");
      }
      router.refresh();
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
        <h1 className="font-display text-2xl font-bold text-navy">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Access your courses and track your progress.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-500 hover:text-blue-600"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-8 py-3 font-body text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href={`/signup${planParams}`}
          className="font-medium text-blue-500 hover:text-blue-600"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      <Suspense fallback={<div className="w-full max-w-md animate-pulse space-y-4"><div className="h-10 rounded bg-gray-200" /><div className="h-64 rounded-xl bg-gray-200" /></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
