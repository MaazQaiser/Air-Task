"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim() : "Sign in failed");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim() : "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-screen flex items-center justify-center overflow-hidden relative" style={{ background: "#080c14" }}>

            {/* Animated background orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)" }}
                />
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)" }}
                />
                <motion.div
                    animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
                />
                {/* Grid lines */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)
                        `,
                        backgroundSize: "60px 60px",
                    }}
                />
            </div>

            {/* Main card */}
            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 25, stiffness: 280 }}
                className="relative w-full max-w-sm mx-4"
            >
                {/* Glass card */}
                <div
                    className="relative overflow-hidden rounded-3xl p-8"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(32px) saturate(180%)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                >
                    {/* Inner glow top */}
                    <div
                        className="absolute top-0 left-0 right-0 h-px"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.5), rgba(0,212,255,0.5), transparent)" }}
                    />

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                            style={{
                                background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(0,212,255,0.3))",
                                border: "1px solid rgba(168,85,247,0.4)",
                                boxShadow: "0 0 24px rgba(168,85,247,0.3), 0 0 48px rgba(0,212,255,0.15)",
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <rect x="4" y="4" width="8" height="8" rx="2" fill="url(#g1)" />
                                <rect x="16" y="4" width="8" height="8" rx="2" fill="url(#g1)" opacity="0.7" />
                                <rect x="4" y="16" width="8" height="8" rx="2" fill="url(#g1)" opacity="0.7" />
                                <rect x="16" y="16" width="8" height="8" rx="2" fill="url(#g1)" />
                                <defs>
                                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                                        <stop stopColor="#a855f7" />
                                        <stop offset="1" stopColor="#00d4ff" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </motion.div>

                        <h1
                            className="text-2xl font-bold tracking-tight bg-clip-text text-transparent"
                            style={{ backgroundImage: "linear-gradient(135deg, #e2e8f0, rgba(226,232,240,0.6))" }}
                        >
                            AirTasks
                        </h1>
                        <p className="text-[12px] mt-1" style={{ color: "rgba(226,232,240,0.35)" }}>
                            {isLogin ? "Welcome back to your workspace" : "Create your spatial workspace"}
                        </p>
                    </div>

                    {/* Google button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-[13px] font-medium transition-all mb-5"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(226,232,240,0.85)",
                        }}
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                        <span className="text-[10px] font-mono" style={{ color: "rgba(226,232,240,0.25)" }}>OR</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleEmailAuth} className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "rgba(226,232,240,0.35)" }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full py-2.5 px-3.5 rounded-xl text-[13px] outline-none transition-all"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(226,232,240,0.85)",
                                }}
                                onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,255,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.08)"; }}
                                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "rgba(226,232,240,0.35)" }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full py-2.5 px-3.5 rounded-xl text-[13px] outline-none transition-all"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(226,232,240,0.85)",
                                }}
                                onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,255,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.08)"; }}
                                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-[12px] px-3 py-2.5 rounded-xl"
                                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all mt-1"
                            style={{
                                background: "linear-gradient(135deg, rgba(168,85,247,0.7), rgba(0,212,255,0.7))",
                                border: "1px solid rgba(168,85,247,0.3)",
                                color: "#fff",
                                boxShadow: "0 4px 20px rgba(168,85,247,0.25)",
                                opacity: loading ? 0.6 : 1,
                            }}
                        >
                            {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                        </motion.button>
                    </form>

                    {/* Toggle */}
                    <p className="mt-6 text-center text-[12px]" style={{ color: "rgba(226,232,240,0.3)" }}>
                        {isLogin ? "New to AirTasks?" : "Have an account?"}{" "}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="font-medium transition-colors hover:opacity-80"
                            style={{ color: "#a855f7" }}
                        >
                            {isLogin ? "Sign up free" : "Sign in"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
