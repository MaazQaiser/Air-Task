"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useAuthStore } from "@/stores/authStore";
import { Comment, subscribeToComments, addComment, toggleReaction, deleteComment } from "@/lib/commentService";
import Image from "next/image";

const EMOJI_PALETTE = ["👍", "❤️", "🔥", "💡", "✅", "😂"];

interface CardCommentsPanelProps {
    cardId: string;
    cardTitle: string;
    onClose: () => void;
}

export default function CardCommentsPanel({ cardId, cardTitle, onClose }: CardCommentsPanelProps) {
    const { activeCanvasId, theme } = useCanvasStore();
    const { user } = useAuthStore();
    const isDark = theme === "dark";

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to Firestore comments
    useEffect(() => {
        if (!activeCanvasId) return;
        setLoading(true);
        const unsubscribe = subscribeToComments(activeCanvasId, cardId, (data) => {
            setComments(data);
            setLoading(false);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        });

        return () => unsubscribe();
    }, [activeCanvasId, cardId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !activeCanvasId || submitting) return;

        setSubmitting(true);
        try {
            await addComment(activeCanvasId, cardId, text.trim());
            setText("");
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReaction = async (commentId: string, emoji: string) => {
        if (!activeCanvasId) return;
        await toggleReaction(activeCanvasId, cardId, commentId, emoji);
    };

    const handleDelete = async (commentId: string) => {
        if (!activeCanvasId || !window.confirm("Delete this comment?")) return;
        await deleteComment(activeCanvasId, cardId, commentId);
    };

    return (
        <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-0 right-0 h-full z-[150] shadow-2xl flex flex-col pointer-events-auto"
            style={{
                width: 360,
                background: isDark ? "rgba(10,14,26,0.95)" : "#ffffff",
                borderLeft: isDark ? "1px solid rgba(255,255,255,0.08)" : "2px solid #111827",
                backdropFilter: "blur(20px)",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4 shrink-0"
                style={{
                    borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "2px solid #111827",
                    background: isDark ? "rgba(0,0,0,0.2)" : "rgba(243,244,246,0.5)",
                }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
                        <MessageCircle size={16} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-[14px] truncate" style={{ color: isDark ? "#fff" : "#111827" }}>
                            {cardTitle}
                        </h3>
                        <p className="text-[11px] font-medium" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {comments.length} {comments.length === 1 ? "comment" : "comments"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-500/10 transition-colors"
                    style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-5 pb-8 flex flex-col gap-6 scrollbar-hide">
                {loading ? (
                    <div className="flex justify-center py-10 opacity-50">
                        <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mt-10">
                        <MessageCircle size={32} className="mb-3" />
                        <p className="text-[13px] font-medium">No comments yet</p>
                        <p className="text-[11px] mt-1">Be the first to share your thoughts.</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const isMe = user?.uid === comment.authorId;
                        return (
                            <div key={comment.id} className="group flex gap-3">
                                {/* Avatar */}
                                <div className="shrink-0 pt-0.5">
                                    {comment.authorPhoto ? (
                                        <Image
                                            src={comment.authorPhoto}
                                            alt={comment.authorName}
                                            width={32}
                                            height={32}
                                            className="rounded-full border border-white/10"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center text-slate-500">
                                            <User size={14} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                        <span className="font-bold text-[13px]" style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                                            {comment.authorName}
                                        </span>
                                        <span className="text-[10px] whitespace-nowrap" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                                            {new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(comment.createdAt)}
                                        </span>
                                    </div>

                                    <p className="text-[13px] leading-relaxed break-words whitespace-pre-wrap" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                                        {comment.text}
                                    </p>

                                    {/* Action Bar (Reactions + Delete) */}
                                    <div className="flex items-center gap-2 mt-2">
                                        {/* Existing Reactions */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(comment.reactions).map(([emoji, users]) => {
                                                const hasReacted = users.includes(user?.uid || "");
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(comment.id, emoji)}
                                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium transition-colors"
                                                        style={{
                                                            background: hasReacted ? "rgba(99,102,241,0.15)" : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
                                                            color: hasReacted ? "#6366f1" : (isDark ? "#94a3b8" : "#64748b"),
                                                            border: `1px solid ${hasReacted ? "rgba(99,102,241,0.3)" : "transparent"}`,
                                                        }}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span>{users.length}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto">
                                            {/* Add Reaction Button */}
                                            <div className="relative group/react">
                                                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-500/10 text-slate-500">
                                                    <span className="text-[12px]">😀</span>
                                                </button>
                                                {/* Mini Emoji Picker */}
                                                <div className="absolute bottom-full right-0 mb-1 hidden group-hover/react:flex bg-[#1e293b] border border-slate-700 rounded-lg p-1 shadow-xl gap-1 z-10">
                                                    {EMOJI_PALETTE.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(comment.id, emoji)}
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded text-[14px]"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            {isMe && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-colors"
                                                    title="Delete comment"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div
                className="px-4 py-4 shrink-0"
                style={{
                    background: isDark ? "rgba(0,0,0,0.3)" : "#f8fafc",
                    borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "2px solid #e2e8f0",
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    className="relative flex items-end gap-2 bg-transparent"
                >
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 max-h-32 min-h-[44px] bg-transparent outline-none resize-none px-3 py-3 text-[13px] leading-relaxed rounded-xl scrollbar-hide"
                        style={{
                            color: isDark ? "#fff" : "#111827",
                            background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
                            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1.5px solid #cbd5e1",
                            boxShadow: isDark ? "inset 0 2px 4px rgba(0,0,0,0.2)" : "inset 0 1px 2px rgba(0,0,0,0.05)",
                        }}
                        rows={1}
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || submitting}
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{
                            boxShadow: text.trim() ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                        }}
                    >
                        <Send size={16} className={text.trim() ? "ml-1" : ""} />
                    </button>
                </form>
                <div className="text-[10px] text-center mt-2 opacity-50 font-medium">
                    Press <kbd className="font-mono bg-black/10 px-1 rounded">Enter</kbd> to send, <kbd className="font-mono bg-black/10 px-1 rounded">Shift+Enter</kbd> for newline
                </div>
            </div>
        </motion.div>
    );
}
