"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-sb-black text-sb-text">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-sb-accent border-t-transparent animate-spin" />
          <span className="text-sm font-mono text-sb-muted">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <DashboardShell />;
}
