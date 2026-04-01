"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Lightbulb,
  BookA,
  FileText,
  Layers,
  Award,
  HelpCircle,
  Settings,
  LogOut,
  Lock,
  ArrowLeft,
  X,
  Sparkles,
  Shield,
} from "lucide-react";
import { logout } from "@/lib/supabase-auth";

import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  /** Route segment appended to /dashboard/courses/[slug]/ — empty string for the course root */
  segment: string;
  /** If true, requires Pro/Premium tier or add-on purchase */
  requiresPurchase?: boolean;
}

const courseNavItems: NavItem[] = [
  { label: "Course", icon: BookOpen, segment: "" },
  { label: "Key Facts", icon: Lightbulb, segment: "key-facts" },
  { label: "Glossary", icon: BookA, segment: "glossary" },
  { label: "Study Guide", icon: FileText, segment: "study-guide" },
  {
    label: "Flash Cards",
    icon: Layers,
    segment: "flash-cards",
    requiresPurchase: true,
  },
  { label: "Certificate", icon: Award, segment: "certificate" },
  { label: "Support", icon: HelpCircle, segment: "support" },
  { label: "Settings", icon: Settings, segment: "settings" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userTier: string;
  isAdmin?: boolean;
}

/** Extract courseSlug from the current pathname, or null if not in a course */
function extractCourseSlug(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/courses\/([^/]+)/);
  return match ? match[1] : null;
}

export function Sidebar({ open, onClose, userTier, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const courseSlug = extractCourseSlug(pathname);

  const hasFlashCards =
    userTier === "pro" || userTier === "premium";

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  async function handleFlashCardsPurchase() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout/flash-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error("Failed to create flash cards checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  /** Check if a nav item is the active page */
  function isActive(item: NavItem): boolean {
    if (!courseSlug) return false;
    const basePath = `/dashboard/courses/${courseSlug}`;

    if (item.segment === "settings") {
      return pathname === "/dashboard/settings";
    }

    if (item.segment === "") {
      return pathname === basePath;
    }

    return pathname.startsWith(`${basePath}/${item.segment}`);
  }

  /** Build the href for a nav item */
  function getHref(item: NavItem): string {
    if (item.segment === "settings") {
      return "/dashboard/settings";
    }
    if (!courseSlug) return "/dashboard";
    if (item.segment === "") {
      return `/dashboard/courses/${courseSlug}`;
    }
    return `/dashboard/courses/${courseSlug}/${item.segment}`;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/testprep4u-logo-light.svg"
            alt="TestPrep4U"
            width={130}
            height={28}
            className="rounded bg-navy p-2"
          />
        </Link>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
        {courseSlug ? (
          <>
            {/* Back to dashboard */}
            <Link
              href="/dashboard"
              onClick={onClose}
              className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </Link>

            {/* Course nav items */}
            {courseNavItems.map((item) => {
              const active = isActive(item);
              const isGated = item.requiresPurchase && !hasFlashCards;

              if (isGated) {
                return (
                  <button
                    key={item.segment}
                    onClick={() => {
                      onClose();
                      setShowUpsellModal(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
                  >
                    <item.icon size={20} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                      Pro
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.segment}
                  href={getHref(item)}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-500"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </>
        ) : (
          <>
            {/* Dashboard landing nav */}
            <Link
              href="/dashboard"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-500"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard/settings")
                  ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-500"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <Settings size={20} />
              Settings
            </Link>
          </>
        )}
        </div>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-200 px-3 py-4">
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onClose}
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-violet-500 transition-colors hover:bg-violet-50 hover:text-violet-600"
          >
            <Shield size={20} />
            Admin Dashboard
          </Link>
        )}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-error"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          {sidebarContent}
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold text-navy">
              Log out?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to log out?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-error/90"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flash Cards upsell modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Sparkles size={22} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-navy">
                  Flash Cards
                </h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-500">
                  Pro Feature
                </span>
              </div>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Reinforce key insurance concepts with digital flash cards.
              Targeted to your weak areas, they help you retain information and
              boost your exam score.
            </p>

            <ul className="mb-5 space-y-2">
              {[
                "Hundreds of cards covering all exam topics",
                "Spaced repetition for efficient study",
                "Track your mastery per topic area",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <Sparkles
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-blue-500"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpsellModal(false)}
                className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Maybe Later
              </button>
              <button
                onClick={handleFlashCardsPurchase}
                disabled={checkoutLoading}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 ease-out hover:bg-blue-600 hover:shadow-[0_4px_16px_rgba(68,127,240,0.35)] disabled:opacity-60"
              >
                {checkoutLoading ? "Loading…" : "Upgrade to Pro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
