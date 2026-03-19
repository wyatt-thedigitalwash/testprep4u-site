"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { useScrolled } from "@/hooks/useScrolled";

type NavLink = (typeof NAV_LINKS)[number];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolled(50);

  const isActive = (href: string) => pathname === href;
  const isCourseActive = (link: NavLink) => {
    if (!("children" in link)) return false;
    return (
      link as NavLink & { children: readonly { href: string }[] }
    ).children.some((c) => pathname === c.href);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy/95 shadow-lg shadow-black/10 backdrop-blur-md"
          : "bg-navy"
      }`}
    >
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-5 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/testprep4u-logo-light.svg"
            alt="TestPrep4U"
            width={160}
            height={34}
            priority
          />
        </Link>

        {/* Desktop nav — centered with generous spacing */}
        <ul className="hidden items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => {
            const hasChildren = "children" in link;
            const active = hasChildren
              ? isCourseActive(link)
              : isActive(link.href);

            return hasChildren ? (
              <li key={link.label} className="group relative">
                {/* Hover trigger — button + invisible bridge to dropdown */}
                <button
                  className={`nav-link relative inline-flex items-center gap-1 border-0 bg-transparent p-0 pb-1 text-sm font-medium transition-colors ${
                    active ? "active text-white" : "text-blue-100 hover:text-white"
                  }`}
                >
                  {link.label}
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </button>

                {/* Invisible bridge so mouse can travel from button to dropdown */}
                <div className="invisible absolute left-1/2 top-full h-3 w-56 -translate-x-1/2 group-hover:visible" />

                {/* Dropdown — shown on hover via group-hover */}
                <ul className="nav-dropdown invisible absolute left-1/2 top-[calc(100%+0.75rem)] w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-navy py-2 opacity-0 shadow-xl transition-none group-hover:visible group-hover:opacity-100">
                  {(
                    link as NavLink & {
                      children: readonly {
                        label: string;
                        href: string;
                      }[];
                    }
                  ).children.map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`nav-link relative inline-flex pb-1 text-sm font-medium transition-colors ${
                    active ? "active text-white" : "text-blue-100 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop CTA — brand outline-dark */}
        <div className="hidden lg:block">
          <Button
            href="/pricing"
            variant="outline-dark"
            className="!px-5 !py-2 text-sm"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-navy px-8 pb-6 lg:hidden">
          <ul className="space-y-1 pt-4">
            {NAV_LINKS.map((link) => {
              const hasChildren = "children" in link;
              return hasChildren ? (
                <li key={link.label}>
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                    {link.label}
                  </p>
                  <ul className="space-y-1 pl-3">
                    {(
                      link as NavLink & {
                        children: readonly {
                          label: string;
                          href: string;
                        }[];
                      }
                    ).children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                            pathname === child.href
                              ? "text-white"
                              : "text-blue-200"
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                      pathname === link.href ? "text-white" : "text-blue-200"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <Button
              href="/pricing"
              variant="outline-dark"
              className="w-full text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
