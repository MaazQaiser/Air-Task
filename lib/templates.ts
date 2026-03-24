import { Task, CardType, Priority, Status } from "@/types/task";
import { generateId } from "@/lib/utils";

export interface TemplateCard {
  relX: number;
  relY: number;
  type: CardType;
  title: string;
  description?: string;
  color: string;
  priority?: Priority;
  status?: Status;
  checklistItems?: { label: string; done: boolean }[];
}

export interface Template {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  description: string;
  cards: TemplateCard[];
}

export const TEMPLATES: Template[] = [
  // ─── Sprint Planning ───────────────────────────────────────────────
  {
    id: "sprint",
    name: "Sprint Planning",
    emoji: "🏃",
    tag: "Engineering",
    description: "Kick off a sprint with epics, user stories, and a velocity tracker.",
    cards: [
      { relX: 0,    relY: 0,    type: "note",      title: "🚀 Sprint Goal",          description: "Define the sprint goal here. What does success look like?", color: "#6366f1", priority: "high" },
      { relX: 260,  relY: 0,    type: "task",      title: "User Story 1",            description: "As a user, I want to…",                                       color: "#00D4FF", priority: "high",   status: "todo" },
      { relX: 520,  relY: 0,    type: "task",      title: "User Story 2",            description: "As a user, I want to…",                                       color: "#00D4FF", priority: "medium", status: "todo" },
      { relX: 780,  relY: 0,    type: "task",      title: "User Story 3",            description: "As a user, I want to…",                                       color: "#00D4FF", priority: "low",    status: "todo" },
      { relX: 0,    relY: 220,  type: "note",      title: "📋 Backlog",              description: "Items not in this sprint but on deck for next.",               color: "#f59e0b" },
      { relX: 260,  relY: 220,  type: "checklist", title: "✅ Sprint Review Checkboxes", color: "#10B981",
        checklistItems: [
          { label: "All stories demoed", done: false },
          { label: "Acceptance criteria met", done: false },
          { label: "Deployment done", done: false },
          { label: "Retrospective scheduled", done: false },
        ]
      },
    ],
  },

  // ─── User Journey Map ──────────────────────────────────────────────
  {
    id: "user-journey",
    name: "User Journey Map",
    emoji: "🗺️",
    tag: "Product",
    description: "Map every stage of the user experience from awareness to advocacy.",
    cards: [
      { relX: 0,   relY: 0,   type: "note", title: "👋 Awareness",   description: "How does the user first discover us?",            color: "#6366f1" },
      { relX: 230, relY: 0,   type: "note", title: "🔍 Consideration", description: "What makes them consider us over alternatives?",  color: "#8b5cf6" },
      { relX: 460, relY: 0,   type: "note", title: "💳 Decision",     description: "What drives the final decision to sign up/buy?",  color: "#ec4899" },
      { relX: 690, relY: 0,   type: "note", title: "🎉 Onboarding",   description: "First-run experience — what's the 'aha' moment?", color: "#10B981" },
      { relX: 920, relY: 0,   type: "note", title: "📣 Advocacy",     description: "What makes them refer friends and share?",        color: "#f59e0b" },
      { relX: 0,   relY: 200, type: "task", title: "😊 Emotion: Hopeful",  description: "Tag each stage with the user's emotion.",    color: "#a855f7", status: "todo" },
      { relX: 460, relY: 200, type: "task", title: "😐 Emotion: Uncertain", description: "",                                         color: "#f59e0b", status: "todo" },
      { relX: 920, relY: 200, type: "task", title: "😍 Emotion: Delighted", description: "",                                         color: "#10B981", status: "todo" },
    ],
  },

  // ─── SWOT Analysis ────────────────────────────────────────────────
  {
    id: "swot",
    name: "SWOT Analysis",
    emoji: "⚔️",
    tag: "Strategy",
    description: "Strengths, Weaknesses, Opportunities, Threats — all in one place.",
    cards: [
      { relX: 0,   relY: 0,   type: "note", title: "💪 Strengths",     description: "What do we do better than anyone else?",                       color: "#10B981" },
      { relX: 330, relY: 0,   type: "note", title: "⚠️ Weaknesses",    description: "Where are our biggest internal gaps?",                        color: "#ef4444" },
      { relX: 0,   relY: 230, type: "note", title: "🌱 Opportunities",  description: "What external trends or gaps can we exploit?",                color: "#6366f1" },
      { relX: 330, relY: 230, type: "note", title: "🌪️ Threats",        description: "What competitive or market forces threaten us?",              color: "#f59e0b" },
    ],
  },

  // ─── Study Session ────────────────────────────────────────────────
  {
    id: "study",
    name: "Study Session",
    emoji: "📚",
    tag: "Personal",
    description: "Structure a focused study block with goals, notes, and a review checklist.",
    cards: [
      { relX: 0,   relY: 0,   type: "task",      title: "🎯 Study Goal",       description: "What do I want to understand by the end of this session?", color: "#00D4FF", priority: "high",   status: "todo" },
      { relX: 280, relY: 0,   type: "note",      title: "📝 Notes",            description: "Capture key concepts, definitions, and diagrams here.",    color: "#10B981" },
      { relX: 560, relY: 0,   type: "note",      title: "💡 Key Insights",     description: "Write your own synthesis — not copy-paste.",                color: "#8b5cf6" },
      { relX: 0,   relY: 220, type: "checklist", title: "✅ Review Checklist", color: "#f59e0b",
        checklistItems: [
          { label: "Read source material", done: false },
          { label: "Took notes in own words", done: false },
          { label: "Did practice problems", done: false },
          { label: "Explained concept out loud", done: false },
          { label: "Scheduled review in 2 days", done: false },
        ]
      },
      { relX: 280, relY: 220, type: "task", title: "🔁 Next Review",    description: "Set a due date for your next spaced-repetition review.", color: "#ec4899", status: "todo" },
    ],
  },

  // ─── Daily Journal ────────────────────────────────────────────────
  {
    id: "journal",
    name: "Daily Journal",
    emoji: "📓",
    tag: "Wellbeing",
    description: "Morning intentions, gratitude, stream of thought, and evening reflection.",
    cards: [
      { relX: 0,   relY: 0,   type: "note", title: "🌅 Morning Intentions", description: "What are my top 3 priorities for today?",                     color: "#f59e0b" },
      { relX: 300, relY: 0,   type: "note", title: "🙏 Gratitude",          description: "Three things I'm grateful for right now…",                   color: "#10B981" },
      { relX: 0,   relY: 220, type: "note", title: "✍️ Stream of Thought",  description: "Free write for 5 minutes — no filter, just write.",          color: "#6366f1" },
      { relX: 300, relY: 220, type: "note", title: "🌙 Evening Reflection", description: "What went well? What would I do differently tomorrow?",       color: "#8b5cf6" },
      { relX: 150, relY: 440, type: "task", title: "⭐ Win of the Day",      description: "Capture one small or big win from today.",                   color: "#ec4899", status: "done" },
    ],
  },
];

/** Convert a Template into real Task objects, centered around (cx, cy) on the canvas. */
export function instantiateTemplate(template: Template, cx: number, cy: number): Task[] {
  // Find bounding box to center the cluster
  const maxRelX = Math.max(...template.cards.map((c) => c.relX));
  const maxRelY = Math.max(...template.cards.map((c) => c.relY));
  const offsetX = cx - maxRelX / 2;
  const offsetY = cy - maxRelY / 2;

  return template.cards.map((tc): Task => ({
    id: generateId(),
    type: tc.type,
    title: tc.title,
    description: tc.description ?? "",
    color: tc.color,
    priority: tc.priority ?? "medium",
    status: tc.status ?? "todo",
    dueDate: null,
    pinned: false,
    docked: false,
    position: { x: offsetX + tc.relX, y: offsetY + tc.relY },
    createdAt: new Date().toISOString(),
    ...(tc.checklistItems
      ? {
          checklistItems: tc.checklistItems.map((ci) => ({
            id: generateId(),
            label: ci.label,
            done: ci.done,
          })),
        }
      : {}),
  }));
}
