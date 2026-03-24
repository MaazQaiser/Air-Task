"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useTaskStore } from "@/stores/taskStore";
import { Task } from "@/types/task";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export default function CalendarOverlay() {
    const { calendarOpen, toggleCalendar, theme } = useCanvasStore();
    const { tasks, updateTask } = useTaskStore();
    const isDark = theme === "dark";

    const [currentDate, setCurrentDate] = useState(new Date());

    // Generate week days
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(weekStart, i));
        }
        return days;
    }, [weekStart]);

    // Hours to display
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

    // Filter tasks that have a due date
    const tasksWithDates = useMemo(() => {
        return tasks.filter((t) => t.dueDate);
    }, [tasks]);

    const handlePreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = (e: React.DragEvent, dayOption: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            updateTask(taskId, { dueDate: dayOption.toISOString() });
        }
    };

    const scrollToTask = (taskId: string) => {
        // Find task on canvas, scroll to it
        const taskNode = document.querySelector(`[data-id="${taskId}"]`);
        if (taskNode) {
            taskNode.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            toggleCalendar();
            
            // Highlight effect
            const el = taskNode as HTMLElement;
            el.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
            el.style.transform = "scale(1.05)";
            el.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.5)";
            setTimeout(() => {
                el.style.transform = "scale(1)";
                el.style.boxShadow = "none";
            }, 1000);
        }
    };

    if (!calendarOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm pointer-events-auto"
                style={{ background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)" }}
            >
                <div
                    className="w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative"
                    style={{
                        background: isDark ? "#0f172a" : "#ffffff",
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "2px solid #111827",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-6 py-4 shrink-0"
                        style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "2px solid #111827" }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold" style={{ color: isDark ? "#f8fafc" : "#111827" }}>
                                    {format(weekStart, "MMMM yyyy")}
                                </h2>
                                <p className="text-sm font-medium" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                                    Time Blocking
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border dark:border-slate-700 border-slate-200">
                                <button
                                    onClick={handlePreviousWeek}
                                    className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 transition"
                                    style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date())}
                                    className="px-3 py-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-sm font-semibold transition"
                                    style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={handleNextWeek}
                                    className="p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 transition"
                                    style={{ color: isDark ? "#cbd5e1" : "#475569" }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <button
                                onClick={toggleCalendar}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                style={{ color: isDark ? "#94a3b8" : "#64748b" }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
                        {/* Days Header */}
                        <div className="flex sticky top-0 z-10" style={{ background: isDark ? "#0f172a" : "#ffffff", borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0" }}>
                            <div className="w-16 shrink-0" /> {/* Time axis spacer */}
                            {weekDays.map((day, i) => {
                                const isToday = isSameDay(day, new Date());
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 py-3 text-center border-l border-slate-200 dark:border-slate-800"
                                    >
                                        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                                            {format(day, "EEE")}
                                        </div>
                                        <div
                                            className={cn("text-lg font-bold mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full", isToday && "bg-indigo-500 text-white")}
                                            style={{ color: !isToday ? (isDark ? "#f1f5f9" : "#1e293b") : undefined }}
                                        >
                                            {format(day, "d")}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Time Grid (Simplified) */}
                        {/* We are simplifying the grid to just be "Day columns" where tasks fall, instead of specific hour slots for now, to make drag and drop cleaner without full exact time management in the card model. */}
                        <div className="flex flex-1 min-h-[500px]">
                            <div className="w-16 shrink-0" /> {/* Left spacer */}
                            {weekDays.map((day, i) => {
                                const dayTasks = tasksWithDates.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));
                                
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 border-l border-slate-200 dark:border-slate-800 p-2 flex flex-col gap-2 transition-colors relative"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day)}
                                        style={{ background: isSameDay(day, new Date()) ? (isDark ? "transparent" : "rgba(99,102,241,0.02)") : "transparent" }}
                                    >
                                        {dayTasks.map((t) => (
                                            <div
                                                key={t.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, t.id)}
                                                onClick={() => scrollToTask(t.id)}
                                                className="p-2 rounded-lg text-sm font-medium cursor-pointer shadow-sm border truncate hover:-translate-y-0.5 transition-transform"
                                                style={{
                                                    background: isDark ? "rgba(30,41,59,0.8)" : "#fff",
                                                    borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0",
                                                    color: isDark ? "#e2e8f0" : "#1e293b",
                                                    borderLeft: `4px solid ${t.color || "#6366f1"}`
                                                }}
                                            >
                                                {t.title}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
