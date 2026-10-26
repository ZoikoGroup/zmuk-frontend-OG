"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const REQUEST_TIMEOUT = 10000;

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Section = { heading: string; body: string; bullets: string[]; order: number };
type Quote = { quote: string; author: string; role: string; order: number };

type Article = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  featured_image: string | null;
  location: string;
  dateline_source: string;
  published_at: string | null;
  intro: string;
  sections: Section[];
  quotes: Quote[];
  about: string;
  contact_company: string;
  contact_website: string;
  contact_email: string;
  contact_phone: string;
  source_name: string;
  source_city: string;
  source_industry: string;
  source_tag: string;
  updated_at: string;
};

type Status = "loading" | "ready" | "notfound" | "network" | "server";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, ms = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

// Pink left-barred section heading — matches the live design.
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-l-4 border-[#e6007e] pl-3 text-lg font-bold text-gray-800 dark:text-white">
      {children}
    </h2>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function NewsArticle({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [pageUrl, setPageUrl] = useState("");

  // Resolve the public URL for the QR code once mounted (avoids SSR mismatch).
  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/news/${slug}/`);
      if (res.status === 404) {
        setStatus("notfound");
        return;
      }
      if (!res.ok) {
        setStatus("server");
        return;
      }
      setArticle(await res.json());
      setStatus("ready");
    } catch {
      setStatus("network");
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Loading ──
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white font-sans dark:bg-gray-900">
        <div className="mx-auto max-w-3xl animate-pulse px-4 py-16 sm:px-6">
          <div className="h-9 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-3 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </main>
    );
  }

  // ── Not found ──
  if (status === "notfound") {
    return (
      <main className="min-h-screen bg-white font-sans dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">Article not found</h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">This article may have been moved or unpublished.</p>
          <Link href="/news" className="mt-6 inline-block text-sm font-semibold text-[#0e8f74] hover:underline dark:text-[#34d39e]">
            ← Back to all news
          </Link>
        </div>
      </main>
    );
  }

  // ── Error (network / server) ──
  if (status === "network" || status === "server" || !article) {
    return (
      <main className="min-h-screen bg-white font-sans dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white">Couldn&rsquo;t load this article</h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            {status === "network"
              ? "We couldn’t reach the server. Check your connection and try again."
              : "Something went wrong on our end. Please try again."}
          </p>
          <button
            onClick={load}
            className="mt-6 rounded-md bg-[#0e8f74] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b7460]"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // ── Ready ──
  return (
    <main className="bg-white font-sans dark:bg-gray-900">
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
        {/* Title + dateline */}
        <h1 className="text-3xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-4xl">{article.title}</h1>
        <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
          {article.location && <span className="text-gray-700 dark:text-gray-200">{article.location}</span>}
          {article.location && " - "}
          {formatDate(article.published_at)}
          {article.dateline_source && ` — ${article.dateline_source}`}
        </p>

        {/* Intro */}
        {article.intro && (
          <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            {paragraphs(article.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Sections */}
        {article.sections.map((s, i) => (
          <section key={i} className="mt-10">
            <SectionHeading>{s.heading}</SectionHeading>
            {s.body && <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-300">{s.body}</p>}
            {s.bullets?.length > 0 && (
              <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
                {s.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Leadership statements */}
        {article.quotes.length > 0 && (
          <section className="mt-10">
            <SectionHeading>Leadership Statements</SectionHeading>
            <div className="mt-4 space-y-4">
              {article.quotes.map((q, i) => (
                <figure key={i} className="rounded-lg bg-gray-50 p-5 ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <blockquote className="text-sm italic leading-relaxed text-gray-600 dark:text-gray-300">&ldquo;{q.quote}&rdquo;</blockquote>
                  <figcaption className="mt-3 text-sm font-bold italic text-gray-800 dark:text-gray-100">
                    — {q.author}
                    {q.role && <span className="font-semibold">, {q.role}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {article.about && (
          <section className="mt-10">
            <SectionHeading>About {article.contact_company || "Zoiko Mobile UK"}</SectionHeading>
            <div className="mt-3 space-y-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
              {paragraphs(article.about).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        )}

        {/* Media Contact */}
        {(article.contact_company || article.contact_email || article.contact_phone) && (
          <section className="mt-10 rounded-xl bg-gray-50 p-6 ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Media Contact</h3>
            <div className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              {article.contact_company && <p className="font-semibold text-gray-700 dark:text-gray-200">{article.contact_company}</p>}
              {article.contact_website && (
                <p>
                  <a href={article.contact_website} target="_blank" rel="noopener noreferrer" className="text-[#0e8f74] hover:underline dark:text-[#34d39e]">
                    {article.contact_website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
              {article.contact_email && (
                <p>
                  <a href={`mailto:${article.contact_email}`} className="text-[#0e8f74] hover:underline dark:text-[#34d39e]">
                    {article.contact_email}
                  </a>
                </p>
              )}
              {article.contact_phone && <p>{article.contact_phone}</p>}
            </div>
          </section>
        )}

        {/* Source Information */}
        {(article.source_name || article.source_city || article.source_industry || article.source_tag) && (
          <section className="mt-6 rounded-xl border border-gray-200 p-6 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Source Information</h3>
            <dl className="mt-3 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
              {article.source_name && (
                <div className="flex gap-2"><dt className="font-semibold text-gray-700 dark:text-gray-200">Source:</dt><dd>{article.source_name}</dd></div>
              )}
              {article.source_city && (
                <div className="flex gap-2"><dt className="font-semibold text-gray-700 dark:text-gray-200">City:</dt><dd>{article.source_city}</dd></div>
              )}
              {article.source_industry && (
                <div className="flex gap-2"><dt className="font-semibold text-gray-700 dark:text-gray-200">Industry:</dt><dd>{article.source_industry}</dd></div>
              )}
              {article.source_tag && (
                <div className="flex gap-2"><dt className="font-semibold text-gray-700 dark:text-gray-200">Tag:</dt><dd>{article.source_tag}</dd></div>
              )}
            </dl>
          </section>
        )}

        {/* Scan to View Online */}
        {pageUrl && (
          <div className="mt-12 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Scan to View Online</p>
            <div className="mt-4 inline-block rounded-lg bg-white p-3 ring-1 ring-gray-200 dark:ring-gray-700">
              <QRCodeCanvas value={pageUrl} size={140} bgColor="#ffffff" fgColor="#111111" level="M" />
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-12">
          <Link href="/news" className="text-sm font-semibold text-[#0e8f74] hover:underline dark:text-[#34d39e]">
            ← Back to all news
          </Link>
        </div>
      </article>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default NewsArticle;
export { NewsArticle };
