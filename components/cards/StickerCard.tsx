"use client";
import { memo, useState } from "react";
import { NodeProps, Handle, Position } from "reactflow";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import { Task } from "@/types/task";
import { useTaskStore } from "@/stores/taskStore";
import { cn } from "@/lib/utils";

/* Sticker emojis palette */
const STICKER_EMOJIS = [
    "👋", "🎉", "🚀", "💡", "🔥", "⭐", "❤️", "👍",
    "🎯", "✅", "📌", "🏆", "💪", "🤔", "😊", "🙌",
    "🎨", "📝", "⚡", "🌟", "🎵", "📸", "🛠️", "🧩",
];

/* Avatar stickers */
const AVATAR_EMOJIS = [
    "🧑‍💻", "👩‍💻", "🧑‍🎨", "👩‍🚀", "🧑‍🔬", "👩‍💼", "🧑‍🏫", "👩‍🔧",
    "🧑‍🍳", "👩‍⚕️", "🧑‍🚒", "👩‍🌾", "🦸‍♂️", "🦸‍♀️", "🧙‍♂️", "🧙‍♀️",
];

function StickerCard({ data, selected }: NodeProps<Task>) {
    const { updateTask, deleteTask, isSelectionMode, selectedIds, toggleSelectCard } = useTaskStore();
    const [picking, setPicking] = useState(false);

    const isSelectedForAction = selectedIds.includes(data.id);

    const isAvatar = data.description === "avatar";
    const emoji = data.title || "⭐";

    const handlePick = (newEmoji: string) => {
        updateTask(data.id, { title: newEmoji });
        setPicking(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 350 }}
            className={cn("group relative cursor-default", selected && "z-10")}
            onClickCapture={(e) => {
                if (isSelectionMode) {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleSelectCard(data.id);
                }
            }}
        >
            {/* Selection Checkbox (Active in Selection Mode) */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-3 -right-3 z-50 flex items-center justify-center rounded-full transition-colors"
                        style={{
                            width: 24,
                            height: 24,
                            background: isSelectedForAction ? "#6366f1" : "rgba(255,255,255,0.1)",
                            border: `2px solid ${isSelectedForAction ? "#6366f1" : "rgba(255,255,255,0.3)"}`,
                            boxShadow: isSelectedForAction ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                        }}
                    >
                        {isSelectedForAction && <Check size={14} color="#fff" strokeWidth={3} />}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Connection Handles */}
            <Handle 
                type="target" 
                position={Position.Top} 
                className={cn(
                    "w-3 h-3 rounded-full border-2 border-white transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: "#00b4ff", boxShadow: "0 0 8px rgba(0,180,255,0.4)" }}
            />
            <Handle 
                type="source" 
                position={Position.Bottom} 
                className={cn(
                    "w-3 h-3 rounded-full border-2 border-white transition-opacity",
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: "#00b4ff", boxShadow: "0 0 8px rgba(0,180,255,0.4)" }}
            />

            {/* Main sticker */}
            <div
                className="flex items-center justify-center select-none"
                style={{
                    width: isAvatar ? 72 : 64,
                    height: isAvatar ? 72 : 64,
                    fontSize: isAvatar ? 42 : 38,
                    borderRadius: isAvatar ? "50%" : 16,
                    background: selected
                        ? "rgba(0,180,255,0.1)"
                        : "rgba(255,255,255,0.03)",
                    border: isSelectionMode
                        ? (isSelectedForAction ? "3px solid #6366f1" : "1px solid rgba(255,255,255,0.06)")
                        : (selected ? "2px solid rgba(0,180,255,0.3)" : "1px solid rgba(255,255,255,0.06)"),
                    boxShadow: isSelectionMode && isSelectedForAction 
                        ? "0 0 0 3px rgba(99,102,241,0.4)"
                        : (selected && !isSelectionMode ? "0 0 20px rgba(0,180,255,0.15)" : "0 2px 8px rgba(0,0,0,0.3)"),
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                }}
                onDoubleClick={() => !isSelectionMode && setPicking(!picking)}
            >
                {emoji}
            </div>

            {/* Delete on hover */}
            <div
                className={cn(
                    "absolute -top-2 -right-2 transition-all duration-200",
                    selected ? "opacity-100 scale-100" : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
                )}
            >
                <button
                    onClick={() => deleteTask(data.id)}
                    className="flex items-center justify-center transition-colors"
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 0,
                    }}
                >
                    <Trash2 size={10} />
                </button>
            </div>

            {/* Emoji picker dropdown */}
            {picking && (
                <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50"
                    style={{
                        width: 236,
                        padding: 10,
                        borderRadius: 16,
                        background: "rgba(12,18,34,0.97)",
                        border: "1px solid rgba(0,180,255,0.08)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    }}
                >
                    <div
                        className="text-[10px] font-mono uppercase tracking-widest mb-2 px-1"
                        style={{ color: "rgba(148,163,184,0.4)" }}
                    >
                        {isAvatar ? "Avatars" : "Stickers"}
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(8, 1fr)",
                            gap: 2,
                        }}
                    >
                        {(isAvatar ? AVATAR_EMOJIS : STICKER_EMOJIS).map((e) => (
                            <button
                                key={e}
                                onClick={() => handlePick(e)}
                                className="flex items-center justify-center transition-all"
                                style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    fontSize: 16,
                                    background: emoji === e ? "rgba(0,180,255,0.1)" : "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = emoji === (e.currentTarget.textContent ?? "") ? "rgba(0,180,255,0.1)" : "transparent";
                                }}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

export default memo(StickerCard);
