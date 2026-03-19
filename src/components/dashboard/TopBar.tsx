"use client";

import { Menu } from "lucide-react";
import { demoStudent } from "@/lib/mock-data";

interface TopBarProps {
  title: string;
  onToggleSidebar: () => void;
}

export function TopBar({ title, onToggleSidebar }: TopBarProps) {
  const initials = demoStudent.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <h1 className="font-display text-xl font-bold text-navy">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {demoStudent.name}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
