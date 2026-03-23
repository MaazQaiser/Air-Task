"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

/* ── Premium Loading Screen ────────────────────────────────── */
function LoadingScreen() {
    return (
        <div
            className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden"
            style={{ background: "#080c14" }}
        >
            {/* Background orbs — same as login for brand continuity */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-40 -left-40"
                    style={{
                        width: 500,
                        height: 500,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 68%)",
                    }}
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.4, 0.25] }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1.5,
                    }}
                    className="absolute -bottom-40 -right-40"
                    style={{
                        width: 560,
                        height: 560,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(0,212,255,0.14) 0%, transparent 68%)",
                    }}
                />
                {/* Dot grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            "radial-gradient(rgba(0,212,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        opacity: 0.3,
                    }}
                />
            </div>

            {/* Animated logo */}
            <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background:
                        "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(0,212,255,0.3))",
                    border: "1px solid rgba(168,85,247,0.35)",
                    boxShadow:
                        "0 0 40px rgba(168,85,247,0.25), 0 0 80px rgba(0,212,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 28,
                }}
            >
                <svg width="34" height="34" viewBox="0 0 26 26" fill="none">
                    {/* 4 squares that animate in sequence */}
                    <motion.rect
                        x="3" y="3" width="8" height="8" rx="2.5"
                        fill="url(#loadGrad)"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.35 }}
                    />
                    <motion.rect
                        x="15" y="3" width="8" height="8" rx="2.5"
                        fill="url(#loadGrad)"
                        opacity={0.65}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.65, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.35 }}
                    />
                    <motion.rect
                        x="3" y="15" width="8" height="8" rx="2.5"
                        fill="url(#loadGrad)"
                        opacity={0.65}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 0.65, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.35 }}
                    />
                    <motion.rect
                        x="15" y="15" width="8" height="8" rx="2.5"
                        fill="url(#loadGrad)"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.35 }}
                    />
                    <defs>
                        <linearGradient id="loadGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop stopColor="#a855f7" />
                            <stop offset="1" stopColor="#00d4ff" />
                        </linearGradient>
                    </defs>
                </svg>
            </motion.div>

            {/* App name */}
            <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    background:
                        "linear-gradient(135deg, #e2e8f0 30%, rgba(226,232,240,0.5))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: 16,
                }}
            >
                AirTasks
            </motion.h1>

            {/* Loading bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                    width: 160,
                    height: 3,
                    borderRadius: 2,
                    background: "rgba(255,255,255,0.06)",
                    overflow: "hidden",
                }}
            >
                <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        width: "40%",
                        height: "100%",
                        borderRadius: 2,
                        background:
                            "linear-gradient(90deg, transparent, #a855f7, #00d4ff, transparent)",
                    }}
                />
            </motion.div>

            {/* Subtle hint text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                style={{
                    marginTop: 20,
                    fontSize: 12,
                    color: "rgba(226,232,240,0.2)",
                    letterSpacing: "0.04em",
                    fontWeight: 400,
                }}
            >
                Preparing your workspace…
            </motion.p>
        </div>
    );
}

/* ── Auth Provider ─────────────────────────────────────────── */
export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, init } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        init();
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
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
