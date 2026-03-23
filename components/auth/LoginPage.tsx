"use client";

import { useState } from "react";
import {
    signInWithPopup,
    GoogleAuthProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

/* ── Human-readable Firebase error messages ── */
function getAuthErrorMessage(err: unknown): string {
    const code = (err as AuthError)?.code ?? "";
    switch (code) {
        case "auth/invalid-email":
            return "That email address doesn\u2019t look right. Please check and try again.";
        case "auth/user-not-found":
            return "No account found with this email. Sign up to create one.";
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Incorrect password. Please try again or reset your password.";
        case "auth/email-already-in-use":
            return "An account with this email already exists. Try signing in instead.";
        case "auth/weak-password":
            return "Password is too weak. Use at least 6 characters.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please wait a moment and try again.";
        case "auth/network-request-failed":
            return "Network error. Check your internet connection and try again.";
        case "auth/popup-closed-by-user":
            return "Sign-in popup was closed. Please try again.";
        case "auth/popup-blocked":
            return "Pop-up blocked by your browser. Allow pop-ups for this site.";
        case "auth/configuration-not-found":
            return "Email/Password sign-in is not enabled. Please use Google sign-in, or enable Email/Password in Firebase Console.";
        default: {
            const msg = err instanceof Error ? err.message : "Authentication failed";
            // Strip Firebase prefix for any unhandled codes
            return msg.replace("Firebase: ", "").replace(/\s*\(auth\/.*?\)/, "").trim() || "Something went wrong. Please try again.";
        }
    }
}

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: unknown) {
            setError(getAuthErrorMessage(err));
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
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: "#080c14" }}
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
                        backgroundImage: "radial-gradient(rgba(0,212,255,0.12) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        opacity: 0.4,
                    }}
                />
            </div>

            {/* ── Auth card ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                style={{ width: "100%", maxWidth: 400, padding: "0 16px" }}
            >
                <div
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(40px) saturate(180%)",
                        WebkitBackdropFilter: "blur(40px) saturate(180%)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: 24,
                        /* Card padding: 40px top + sides, 32px bottom — generous but intentional */
                        padding: "40px 32px 32px",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Top iridescent line */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 1,
                            background: "linear-gradient(90deg, transparent 5%, rgba(168,85,247,0.6) 35%, rgba(0,212,255,0.6) 65%, transparent 95%)",
                        }}
                    />

                    {/* ── Logo block ── */}
                    <div style={{ textAlign: "center", marginBottom: 32 }}>
                        {/* App icon */}
                        <motion.div
                            whileHover={{ scale: 1.06, rotate: 4 }}
                            transition={{ type: "spring", damping: 12 }}
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 16,
                                background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(0,212,255,0.35))",
                                border: "1px solid rgba(168,85,247,0.45)",
                                boxShadow: "0 0 24px rgba(168,85,247,0.3), 0 0 48px rgba(0,212,255,0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                            }}
                        >
                            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                                <rect x="3" y="3" width="8" height="8" rx="2.5" fill="url(#lg)" />
                                <rect x="15" y="3" width="8" height="8" rx="2.5" fill="url(#lg)" opacity="0.65" />
                                <rect x="3" y="15" width="8" height="8" rx="2.5" fill="url(#lg)" opacity="0.65" />
                                <rect x="15" y="15" width="8" height="8" rx="2.5" fill="url(#lg)" />
                                <defs>
                                    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                                        <stop stopColor="#a855f7" />
                                        <stop offset="1" stopColor="#00d4ff" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </motion.div>

                        {/* H1 — app name */}
                        <h1
                            style={{
                                fontSize: 28,
                                fontWeight: 700,
                                letterSpacing: "-0.03em",
                                background: "linear-gradient(135deg, #e2e8f0 30%, rgba(226,232,240,0.5))",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                lineHeight: 1.2,
                                marginBottom: 6,
                            }}
                        >
                            AirTasks
                        </h1>

                        {/* Subtitle / body */}
                        <p
                            style={{
                                fontSize: 13,
                                lineHeight: "19px",
                                color: "rgba(226,232,240,0.38)",
                                fontWeight: 400,
                            }}
                        >
                            {isLogin ? "Welcome back to your workspace" : "Create your spatial workspace"}
                        </p>
                    </div>

                    {/* ── Google Button ── */}
                    <motion.button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: "100%", marginBottom: 20 }}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </motion.button>

                    {/* ── Divider ── */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: "0.08em",
                                color: "rgba(226,232,240,0.25)",
                                textTransform: "uppercase",
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            or
                        </span>
                        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                    </div>

                    {/* ── Email / Password form ── */}
                    <form onSubmit={handleEmailAuth} className="form-stack">
                        {/* Email field */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        {/* Password field */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="input"
                                    style={{ paddingRight: 42 }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    style={{
                                        position: "absolute",
                                        right: 4,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: 32,
                                        height: 32,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "rgba(226,232,240,0.35)",
                                        borderRadius: 8,
                                        transition: "color 0.15s ease, background 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "rgba(226,232,240,0.7)";
                                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "rgba(226,232,240,0.35)";
                                        e.currentTarget.style.background = "none";
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        background: "rgba(239,68,68,0.1)",
                                        border: "1px solid rgba(239,68,68,0.22)",
                                        color: "#f87171",
                                        fontSize: 13,
                                        lineHeight: "18px",
                                    }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit button */}
                        <motion.button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                width: "100%",
                                opacity: loading ? 0.6 : 1,
                                marginTop: 4,
                            }}
                            whileHover={!loading ? { scale: 1.015 } : {}}
                            whileTap={!loading ? { scale: 0.985 } : {}}
                            disabled={loading}
                        >
                            {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
                        </motion.button>
                    </form>

                    {/* ── Toggle login / signup ── */}
                    <p
                        style={{
                            marginTop: 20,
                            textAlign: "center",
                            fontSize: 13,
                            color: "rgba(226,232,240,0.32)",
                        }}
                    >
                        {isLogin ? "New to AirTasks?" : "Already have an account?"}{" "}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#a855f7",
                                fontWeight: 500,
                                fontSize: 13,
                                padding: 0,
                                fontFamily: "inherit",
                            }}
                        >
                            {isLogin ? "Sign up free" : "Sign in"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
