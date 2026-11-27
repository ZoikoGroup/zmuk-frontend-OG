"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export const SUPPORT_EMAIL = "help@zoikomobile.co.uk";

// mailto: does nothing when the computer has no mail app set up, so the link opens a Gmail
// compose window in a new tab instead. The address is also shown with a Copy button.
export const supportGmailHref = (to: string = SUPPORT_EMAIL) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;

export function CopyEmailButton({
  email = SUPPORT_EMAIL,
  className = "",
}: {
  email?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // Older browsers / insecure origin: fall back to a temporary textarea.
      try {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Email address copied" : `Copy ${email}`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#C8104E] px-3 py-1 text-xs font-semibold text-[#C8104E] transition-colors hover:bg-[#C8104E] hover:text-white ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy email"}
    </button>
  );
}
