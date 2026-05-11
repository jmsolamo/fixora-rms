"use client";

import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  displayName: string;
  onLogout: () => void;
};

export function AdminHeader({ displayName, onLogout }: AdminHeaderProps) {
  const pathname = usePathname();
  
  // Simple breadcrumb logic
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-300 bg-white/80 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80 lg:px-8">
      <div className="flex items-center gap-2 text-[14px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const label = segment.replace(/-/g, " ");

          return (
            <div key={segment} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-300 dark:text-gray-600">/</span>}
              <span
                className={cn(
                  "transition-colors",
                  isLast
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "font-medium hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-x-3 border-r border-gray-300 pr-4 dark:border-gray-700">
          <img
            className="size-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
            src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=634&h=634&q=80"
            alt="Profile"
          />
          <div className="flex flex-col">
            <p className="text-[14px] font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
              {displayName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex size-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="size-5" />
        </button>
      </div>
    </header>
  );
}
