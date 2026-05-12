"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChevronsLeft, ChevronsRight, Sparkles, Wrench, Hammer, LayoutDashboard, Users, BarChart3, UserCog, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "fixora-admin-sidebar-collapsed";

function readInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

const navItemClass = (collapsed: boolean) =>
  cn(
    "flex transform items-center rounded-lg text-sm font-medium text-gray-600 transition-colors duration-300 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-200",
    collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
  );

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(readInitialCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-gray-300 bg-white transition-[width,padding] duration-200 ease-in-out dark:border-gray-800 dark:bg-gray-900",
        collapsed ? "w-[4.5rem] px-2" : "w-64 pl-5 pr-2",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-gray-300 dark:border-gray-800",
          collapsed ? "justify-center" : "justify-between gap-1",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="group flex flex-col items-center justify-center rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Expand sidebar"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 transition-colors group-hover:bg-primary/25 dark:bg-primary/25 dark:group-hover:bg-primary/35">
              <PanelLeftOpen className="size-5 text-primary" />
            </div>
          </button>
        ) : (
          <>
            <Link
              href="/admin"
              className="flex min-w-0 items-center gap-2 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary/40"
              title="Fixora-RMS"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 dark:bg-primary/25">
                <Sparkles className="size-4 text-primary" />
              </div>
              <span className="truncate text-[14px] font-semibold tracking-wide text-gray-900 dark:text-white">
                Fixora - RMS
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleCollapsed}
              className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-expanded={true}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="size-5" />
            </button>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-1 flex-col justify-between">
        <nav className={cn("-mx-3 flex-1 space-y-3", collapsed && "-mx-1")}>




          <Link
            href="/admin"
            className={navItemClass(collapsed)}
            title="Dashboard"
          >
            <LayoutDashboard className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>Dashboard</span>
          </Link>

          <Link
            href="/admin/tools-management"
            className={navItemClass(collapsed)}
            title="Tools Management"
          >
            <Wrench className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>
              Tools Management
            </span>
          </Link>

          <Link
            href="/admin/tools-repair"
            className={navItemClass(collapsed)}
            title="Tools Repair"
          >
            <Hammer className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>
              Tools Repair
            </span>
          </Link>

          <Link
            href="/admin/personnel"
            className={navItemClass(collapsed)}
            title="Personnel"
          >
            <Users className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>Personnel</span>
          </Link>

          <Link
            href="/admin/reports"
            className={navItemClass(collapsed)}
            title="Reports"
          >
            <BarChart3 className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>Reports</span>
          </Link>

          <Link
            href="/admin/accounts"
            className={navItemClass(collapsed)}
            title="Account Management"
          >
            <UserCog className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>
              Account Management
            </span>
          </Link>

          <Link
            href="/admin/settings"
            className={navItemClass(collapsed)}
            title="Settings"
          >
            <Settings className="size-5 shrink-0" aria-hidden />
            <span className={cn("mx-2", collapsed && "sr-only")}>Settings</span>
          </Link>
        </nav>

      </div>
    </aside>
  );
}
