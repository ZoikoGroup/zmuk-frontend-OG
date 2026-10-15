import { NextRequest, NextResponse } from "next/server";
import {
  ZOIKO_KB,
  fallbackResponse,
  type ChatItem,
  type ChatTurn,
} from "./knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

function ensureMainMenu(items: ChatItem[]): ChatItem[] {
  const hasMainMenu = items.some((i) =>
    (typeof i === "string" ? i : i.text ?? "").includes("Main Menu"),
  );
  return hasMainMenu ? items : [...items, "🏠 Main Menu"];
}

export async function POST(req: NextRequest) {
  let message = "";
  let history: ChatTurn[] = [];

  try {
    const body = await req.json();
    message = (body?.message ?? "").toString();
    history = Array.isArray(body?.history) ? (body.history as ChatTurn[]) : [];
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!message.trim()) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  // No API key configured → keyword fallback (still useful answers).
  if (!OPENAI_API_KEY) {
    const fb = fallbackResponse(message);
    return NextResponse.json({ reply: fb.reply, items: ensureMainMenu(fb.items), history });
  }

  try {
    const messages: ChatTurn[] = [
      { role: "system", content: ZOIKO_KB },
      ...history.slice(-10).filter(
        (t) => t && typeof t === "object" && "role" in t && "content" in t,
      ),
      { role: "user", content: message },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[zovie] OpenAI error:", res.status, detail);
      const fb = fallbackResponse(message);
      return NextResponse.json({ reply: fb.reply, items: ensureMainMenu(fb.items), history });
    }

    const data = await res.json();
    let reply: string = data?.choices?.[0]?.message?.content ?? "";

    // Extract the [MENU_ITEMS: a | b | c] tag the model is asked to append.
    let items: ChatItem[] = [];
    const match = reply.match(/\[MENU_ITEMS:([^\]]+)\]/i);
    if (match) {
      items = match[1]
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      reply = reply.replace(/\[MENU_ITEMS:[^\]]+\]/gi, "").trim();
    }
    if (items.length === 0) items = ["🏠 Main Menu"];

    const nextHistory: ChatTurn[] = [
      ...history,
      { role: "user" as const, content: message },
      { role: "assistant" as const, content: reply },
    ].slice(-20);

    return NextResponse.json({
      reply,
      items: ensureMainMenu(items),
      history: nextHistory,
    });
  } catch (err) {
    console.error("[zovie] chat handler error:", err);
    const fb = fallbackResponse(message);
    return NextResponse.json({ reply: fb.reply, items: ensureMainMenu(fb.items), history });
  }
}
