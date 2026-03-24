import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task } from "@/types/task";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

function buildPrompt(cards: Task[]): string {
    const lines = cards.map((c, i) => {
        const parts: string[] = [`${i + 1}. [${c.type.toUpperCase()}] "${c.title}"`];
        if (c.description) parts.push(`   Description: ${c.description}`);
        if (c.status)      parts.push(`   Status: ${c.status}`);
        if (c.priority)    parts.push(`   Priority: ${c.priority}`);
        if (c.dueDate)     parts.push(`   Due: ${c.dueDate}`);
        if (c.checklistItems?.length) {
            const done   = c.checklistItems.filter((ci) => ci.done).length;
            const total  = c.checklistItems.length;
            parts.push(`   Checklist: ${done}/${total} items done`);
        }
        return parts.join("\n");
    });

    return `You are a smart productivity assistant. A user has selected ${cards.length} cards from their digital canvas workspace and wants a concise summary.

Here are the selected cards:

${lines.join("\n\n")}

Generate a SHORT, punchy summary (3–5 sentences max) suitable for a standup update or status report. Use plain language. No markdown headers. Focus on what's in progress, what's done, and any blockers or priorities worth flagging. Be direct and actionable.`;
}

export async function summarizeCards(cards: Task[]): Promise<string> {
    if (!API_KEY) {
        // Graceful mock response when no API key is configured
        return `Summary: ${cards.length} cards selected. Items include: ${cards.map((c) => `"${c.title}"`).join(", ")}. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local to enable AI-generated summaries.`;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(buildPrompt(cards));
    return result.response.text();
}
