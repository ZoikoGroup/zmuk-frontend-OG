"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// The Zovie chatbot is served by this same website (see /public/zovie-chat.html),
// so there is no separate service to run. ?embed=1 tells the page to hide its own
// floating button/header and let this widget control the panel.
const CHAT_URL = "/zovie-chat.html?embed=1";

const OPEN_EVENT = "zoiko-open-chat";

/** Open the chat from anywhere on the site (e.g. the support page). */
export function openChat() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}

export default function ChatbotWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // lazily create the iframe
  const [unread, setUnread] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const show = useCallback(() => {
    setMounted(true);
    setOpen(true);
    setUnread(false);
  }, []);

  // Other components call openChat() -> OPEN_EVENT.
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, [show]);

  // Esc closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The embedded chatbot asks us to close the panel or navigate same-site (keeps the user in the app).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { type?: string; url?: string } | null;
      if (!data) return;
      // Minimise / close buttons live in the chat's own header.
      if (data.type === "zovie:close") {
        setOpen(false);
        return;
      }
      if (data.type !== "zovie:navigate" || !data.url) return;
      if (data.url.startsWith("/")) {
        setOpen(false);
        router.push(data.url);
      } else {
        window.open(data.url, "_blank", "noopener");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  return (
    <>
      {/* Chat panel */}
      {mounted && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Zovie live chat"
          aria-hidden={!open}
          className={`fixed z-[9998] flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-200
            inset-0
            sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[680px] sm:max-h-[calc(100vh-8rem)] sm:w-[440px] sm:rounded-3xl
            ${open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        >
          {/* Embedded chatbot — kept mounted so the conversation survives closing the panel */}
          <iframe
            src={CHAT_URL}
            title="Zovie chat"
            className="h-full w-full flex-1 border-0 bg-white"
            allow="microphone"
          />
        </div>
      )}

      {/* Floating toggle (bottom-right) — square tile with the ZMUK logo */}
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        aria-label={open ? "Close chat" : "Open live chat"}
        aria-expanded={open}
        className={`fixed bottom-5 right-5 z-[9999] h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.28)] transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#E5125A]/30
          ${open ? "hidden sm:flex" : "flex"}`}
      >
        {open ? (
          <svg className="h-6 w-6 text-[#E5125A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Square ZMUK mark. The real file lives at /public/images/zovie-logo.png —
             overwrite that file with your logo (square works best). Falls back to
             the site logo if it is ever missing. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/images/zovie-logo.png"
            alt="Zoiko Mobile"
            className="h-10 w-10 object-contain"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = "/images/logo.png";
              }
            }}
          />
        )}
        {!mounted && unread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#E5125A] text-[10px] font-bold text-white">
            1
          </span>
        )}
      </button>
    </>
  );
}
