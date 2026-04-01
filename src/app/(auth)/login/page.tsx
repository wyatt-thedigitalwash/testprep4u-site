"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { login, resendConfirmation } from "@/lib/supabase-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const course = searchParams.get("course");
  const discount = searchParams.get("discount");
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(callbackError || "");
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Build query string to preserve plan + discount context in links
  const discountSuffix = discount ? `&discount=${encodeURIComponent(discount)}` : "";
  const planParams =
    plan && course ? `?plan=${plan}&course=${course}${discountSuffix}` : "";

  async function handleResend() {
    if (!email) {
      setError("Enter your email above, then click resend.");
      return;
    }
    setResending(true);
    setResendSuccess(false);
    const { error: resendError } = await resendConfirmation(email);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResendSuccess(true);
    }
    setResending(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setResendSuccess(false);
    setLoading(true);

    const { error: authError } = await login(email, password);
    if (authError) {
      // Map Supabase error messages to user-friendly text
      const msg = authError.message;
      if (msg.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please confirm your email address before signing in. Check your inbox for the confirmation link.");
        setEmailNotConfirmed(true);
      } else if (msg.includes("Too many requests") || msg.includes("rate limit")) {
        setError("Too many login attempts. Please wait a moment and try again.");
      } else {
        setError(msg);
      }
      setLoading(false);
    } else {
      // If plan context exists, go straight to pricing with auto-checkout
      if (plan && course) {
        const dp = discount ? `&discount=${encodeURIComponent(discount)}` : "";
        router.push(
          `/pricing?plan=${plan}&course=${course}&autoCheckout=true${dp}`
        );
        router.refresh();
        return;
      }

      // Check admin status and enrollment state for redirect
      try {
        const res = await fetch("/api/user/has-enrollments");
        if (!res.ok) {
          router.push("/dashboard");
        } else {
          const data = await res.json();
          if (data.isAdmin) {
            router.push("/admin");
          } else {
            router.push(data.hasEnrollments ? "/dashboard" : "/pricing");
          }
        }
      } catch {
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
                href={`/forgot-password${planParams}`}
                className="text-xs font-medium text-blue-500 hover:text-blue-600"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
              <p>{error}</p>
              {emailNotConfirmed && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="mt-2 font-medium underline hover:text-error/80 disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend confirmation email"}
                </button>
              )}
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-lg bg-success-light px-4 py-3 text-sm text-success">
              Confirmation email sent! Check your inbox.
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
