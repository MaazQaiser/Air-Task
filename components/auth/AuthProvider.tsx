"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init(); // initialize listener on mount
  }, [init]);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
      if (user && pathname === "/login") {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-900">
        <div className="animate-pulse text-white/50">Loading AirTasks...</div>
      </div>
    );
  }

  return <>{children}</>;
}
