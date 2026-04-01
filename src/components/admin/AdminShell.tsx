"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

const pageTitles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/customers": "Customers",
  "/admin/referrals": "Referrals",
  "/admin/students": "Students",
  "/admin/courses": "Courses",
  "/admin/analytics": "Analytics",
  "/admin/discount-codes": "Discount Codes",
  "/admin/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/admin/students/")) return "Student Detail";
  if (pathname.startsWith("/admin/courses/")) return "Course Detail";
  return "Admin";
}

interface AdminShellProps {
  userName: string;
  children: React.ReactNode;
}

export function AdminShell({ userName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar
          title={getPageTitle(pathname)}
          userName={userName}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
