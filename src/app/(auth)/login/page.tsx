"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (login(email, password)) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
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

        {/* Demo hint */}
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-100/50 px-4 py-3 text-center text-xs text-gray-600">
          <span className="font-semibold text-navy">Demo credentials:</span>{" "}
          demo@testprep4u.com / demo123
        </div>
      </div>
    </div>
  );
}
