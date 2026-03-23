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
            style={{ background: "var(--bg-base)" }}
        >
            {/* ── Background atmosphere ────────────────── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Orb top-left */}
                <motion.div
                    animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.5, 0.35] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-48 -left-48"
                    style={{
                        width: 560,
                        height: 560,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 68%)",
                    }}
                />
                {/* Orb bottom-right */}
                <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.28, 0.42, 0.28] }}
                    transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-48 -right-48"
                    style={{
                        width: 640,
                        height: 640,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 68%)",
                    }}
                />
                {/* Subtle dot grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        opacity: 0.4,
                    }}
                />

                {/* Illustration on bottom right */}
                <motion.img 
                    initial={{ opacity: 0, y: 30, x: 30 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    src="/assets/illustration.png"
                    alt="Team Collaboration"
                    className="absolute bottom-8 right-12 z-0 pointer-events-none"
                    style={{ 
                        width: "clamp(250px, 28vw, 550px)", 
                        objectFit: "contain" 
                    }}
                />
            </div>

            {/* Animated logo */}
            <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: "#ffffff",
                    border: "3px solid #111827",
                    boxShadow: "3px 3px 0 #111827",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 28,
                    overflow: "hidden",
                    padding: 6,
                    zIndex: 10
                }}
            >
                <img src="/assets/logo.png" alt="AirTasks Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </motion.div>

            {/* App name */}
            <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                    fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em",
                    color: "#111827",
                    marginBottom: 16,
                    zIndex: 10
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
                    width: 160, height: 3, borderRadius: 2,
                    background: "rgba(0,0,0,0.06)", overflow: "hidden",
                    zIndex: 10
                }}
            >
                <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        width: "40%", height: "100%", borderRadius: 2,
                        background: "linear-gradient(90deg, transparent, #6366f1, #06b6d4, transparent)",
                    }}
                />
            </motion.div>

            {/* Hint text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                style={{
                    marginTop: 20, fontSize: 12,
                    color: "rgba(17,24,39,0.35)",
                    letterSpacing: "0.04em", fontWeight: 500,
                    zIndex: 10
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
