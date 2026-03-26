"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes("/certificate")) return "Certificate";
  if (pathname.includes("/affidavit")) return "Self-Study Affidavit";
  if (pathname.includes("/final-exam")) return "Final Exam";
  if (pathname.includes("/practice-exam")) return "Practice Exam";
  if (pathname.includes("/quiz/")) return "Section Quiz";
  if (pathname.includes("/module/")) return "Course Module";
  if (pathname.includes("/exams")) return "Practice Exams";
  if (pathname.includes("/courses/")) return "Course Details";
  if (pathname.includes("/courses")) return "My Courses";
  return "Dashboard";
}

interface DashboardShellProps {
  userName: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={getPageTitle(pathname)}
          userName={userName}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
