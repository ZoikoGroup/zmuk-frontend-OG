import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FeedbackBody {
  rating?: number | string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
}

/**
 * Ported from zovie_chatbot-main (Django `feedback` view).
 *
 * The Django version stored feedback in Postgres and emailed it via SMTP.
 * The website has no chatbot database, so we log it here and — if email is
 * configured (RESEND_API_KEY + FEEDBACK_TO) — send it on to the support team.
 */
export async function POST(req: NextRequest) {
  let body: FeedbackBody;
  try {
    body = (await req.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ status: "error", detail: "Invalid JSON" }, { status: 400 });
  }

  const rating = Number(body.rating ?? 0) || 0;
  const name = body.name || "Anonymous";
  const phone = body.phone || "";
  const email = body.email || "";
  const message = body.message || "";

  const stars = "★".repeat(Math.max(0, Math.min(5, rating))) +
    "☆".repeat(Math.max(0, 5 - rating));

  // Always log so feedback is never lost (visible in the Next.js server logs).
  console.log("\n===== ZOVIE FEEDBACK =====");
  console.log("Name   :", name);
  console.log("Email  :", email);
  console.log("Phone  :", phone);
  console.log("Rating :", `${stars} (${rating}/5)`);
  console.log("Message:", message);
  console.log("==========================\n");

  // Optional email delivery (serverless friendly).
  const resendKey = process.env.RESEND_API_KEY;
  const feedbackTo = process.env.FEEDBACK_TO;
  if (resendKey && feedbackTo) {
    const from = process.env.FEEDBACK_FROM || "Zovie Chatbot <onboarding@resend.dev>";
    const emailBody = [
      "New Chatbot Feedback / Support Request",
      "=======================================",
      "",
      `Name    : ${name}`,
      `Email   : ${email}`,
      `Phone   : ${phone}`,
      `Rating  : ${stars}  (${rating} / 5)`,
      "",
      "Message:",
      message,
      "",
      `Received: ${new Date().toISOString()}`,
    ].join("\n");

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from,
          to: [feedbackTo],
          subject: `[Zovie] New Feedback — ${rating}★ from ${name}`,
          text: emailBody,
          reply_to: email || undefined,
        }),
      });
      if (!res.ok) {
        console.error("[zovie] Feedback email failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("[zovie] Feedback email error:", err);
    }
  }

  return NextResponse.json({ status: "success" });
}
