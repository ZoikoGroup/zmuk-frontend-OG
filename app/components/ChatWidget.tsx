"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// In .env.local:  NEXT_PUBLIC_CHATBOT_URL=http://127.0.0.1:8001
// On the live site, set it to the deployed chatbot address.
const CHATBOT_ORIGIN = (process.env.NEXT_PUBLIC_CHATBOT_URL ?? "http://127.0.0.1:8001").replace(/\/$/, "");
const CHATBOT_URL = `${CHATBOT_ORIGIN}/?embed=1`; // embed mode: no second bubble/header
const CHATBOT_STANDALONE_URL = `${CHATBOT_ORIGIN}/`; // for "open in new tab"

// true  = chat opens in the panel on the page (chatbot must allow iframe embedding)
// false = chat opens in a popup window instead
const EMBED_ALLOWED = true;

const OPEN_EVENT = "zoiko-open-chat";

/**
 * Call this from any button/link on the site to open the chat,
 * e.g. the "Live Chat" card on /support or /contact-us.
 */
export function openChat() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}

function openChatPopup() {
  const w = 420;
  const h = 680;
  const left = window.screenX + window.outerWidth - w - 20;
  const top = window.screenY + window.outerHeight - h - 20;
  const popup = window.open(
    CHATBOT_STANDALONE_URL,
    "zovie-chat",
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  );
  if (!popup) window.open(CHATBOT_STANDALONE_URL, "_blank", "noopener"); // popup blocked → new tab
  else popup.focus();
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * Site-wide chat widget. Add it once in app/layout.tsx.
 * - Floating purple bubble in the bottom-right corner on every page.
 * - The chatbot iframe loads on first open and stays loaded, so the
 *   conversation survives closing/reopening and navigating between pages.
 */
export default function ChatWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const show = useCallback(() => {
    if (!EMBED_ALLOWED) {
      openChatPopup();
      return;
    }
    setHasOpened(true);
    setOpen(true);
  }, []);

  // Let other parts of the site open the chat (openChat())
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, [show]);

  // Close with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The chatbot asks us to open a page (e.g. "Visit Support" → "/support")
  useEffect(() => {
    const chatbotOrigin = new URL(CHATBOT_ORIGIN).origin;

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== chatbotOrigin) return; // only trust messages from the chatbot
      if (e.data?.type !== "zovie:navigate" || typeof e.data.url !== "string") return;

      let target: URL;
      try {
        target = new URL(e.data.url, window.location.origin);
      } catch {
        return;
      }

      if (target.origin === window.location.origin) {
        router.push(target.pathname + target.search + target.hash); // our own pages
      } else if (target.protocol === "https:" || target.protocol === "http:") {
        window.open(target.href, "_blank", "noopener"); // external links
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  return (
    <>
      {/* ─── Chat panel ─── */}
      {hasOpened && (
        <div
          role="dialog"
          aria-label="Zovie live chat"
          aria-hidden={!open}
          className={`fixed z-[9998] flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-200
            inset-0
            sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[620px] sm:max-h-[calc(100vh-8rem)] sm:w-[400px] sm:rounded-2xl
            dark:bg-gray-900
            ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#7c3aed] to-[#9333ea] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Zovie</p>
              <p className="text-xs text-white/85">Your Zoiko Mobile assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={CHATBOT_STANDALONE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open chat in a new tab"
                title="Open in new tab"
                className="rounded-md p-1.5 hover:bg-white/20"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1.5 hover:bg-white/20"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chatbot */}
          <div className="relative flex-1 bg-[#f9fafb]">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                Loading chat…
              </div>
            )}
            <iframe
              src={CHATBOT_URL}
              title="Zovie live chat"
              onLoad={() => setLoaded(true)}
              allow="clipboard-write; microphone"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}

      {/* ─── Floating bubble ─── */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        aria-label={open ? "Close chat" : "Open live chat"}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-[9999] h-16 w-16 items-center justify-center rounded-full bg-[#8b2fe0] text-white shadow-[0_8px_24px_rgba(139,47,224,0.45)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#8b2fe0]/30 cursor-pointer
          ${open ? "hidden sm:flex" : "flex"}`}
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-4 3v-3H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
            <circle cx="8.5" cy="11" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="11" r="1" fill="currentColor" stroke="none" />
          </svg>
        )}

        {/* Unread badge until the user opens the chat for the first time */}
        {!hasOpened && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold">
            1
          </span>
        )}
      </button>
    </>
  );
}