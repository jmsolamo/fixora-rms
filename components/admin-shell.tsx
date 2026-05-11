"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  clearAuthSession,
  loadAuthSession,
  type AuthSession,
} from "@/lib/auth-session";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const s = loadAuthSession();
    if (!s || s.role !== 1) {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  const onLogout = () => {
    clearAuthSession();
    router.replace("/");
  };

  return (
    <div className="flex min-h-screen bg-background text-gray-900 dark:text-gray-100">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          displayName={session.displayName || session.username}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50 p-6 dark:bg-gray-900/50 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
