"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { sanitizeArticleHtml } from "@/lib/sanitizeArticle";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

/** GET /api/blog/posts/<slug>/ */
interface BlogPost {
  id: number;
  title: string;
  slug: string;
  author: string;
  content: string;
  featured_image: string | null;
  excerpt: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

/** GET /api/blog/posts/<slug>/related/ — unpaginated array */
interface RelatedPost {
  id: number;
  title: string;
  slug: string;
  featured_image: string | null;
  created_at: string;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function imageUrl(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

/**
 * Article typography. These are ordinary Tailwind arbitrary variants with
 * proper `dark:` pairs — no !important, no forced light surface.
 *
 * They work because sanitizeArticleHtml() has already stripped the inline
 * colour/background/font declarations that used to override them.
 */
const ARTICLE_CLASSES = [
  "text-sm leading-relaxed text-gray-700 dark:text-gray-300",

  // Headings
  "[&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-snug [&_h1]:text-gray-900 dark:[&_h1]:text-white",
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-gray-900 dark:[&_h2]:text-white",
  "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 dark:[&_h3]:text-white",
  "[&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-gray-900 dark:[&_h4]:text-white",

  // Body
  "[&_p]:mb-4",
  "[&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-white",
  "[&_b]:font-semibold [&_b]:text-gray-900 dark:[&_b]:text-white",
  "[&_em]:italic",
  "[&_a]:font-medium [&_a]:text-[#e6007e] [&_a]:underline hover:[&_a]:no-underline dark:[&_a]:text-pink-400",

  // Lists
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:mb-1.5",
  "[&_li>ul]:mt-1.5 [&_li>ol]:mt-1.5",

  // Media
  "[&_img]:my-6 [&_img]:mx-auto [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl",
  "[&_figure]:my-6",
  "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-gray-500 dark:[&_figcaption]:text-gray-400",
  "[&_iframe]:my-6 [&_iframe]:max-w-full [&_iframe]:rounded-xl",

  // Quotes + rules
  "[&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-green-500 [&_blockquote]:bg-gray-50 [&_blockquote]:py-3 [&_blockquote]:pl-4 [&_blockquote]:italic dark:[&_blockquote]:bg-gray-900/60",
  "[&_hr]:my-8 [&_hr]:border-gray-200 dark:[&_hr]:border-gray-700",
  "[&_mark]:bg-yellow-200 [&_mark]:text-gray-900 dark:[&_mark]:bg-yellow-500/40 dark:[&_mark]:text-yellow-50",
  "[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs dark:[&_code]:bg-gray-900",

  // Tables — sanitizer wraps each one in [data-table-scroll]
  "[&_[data-table-scroll]]:my-5 [&_[data-table-scroll]]:w-full [&_[data-table-scroll]]:overflow-x-auto",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs",
  "[&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 dark:[&_th]:border-gray-700 dark:[&_th]:bg-gray-900 dark:[&_th]:text-white",
  "[&_td]:border [&_td]:border-gray-200 [&_td]:p-2.5 [&_td]:align-top [&_td]:text-gray-700 dark:[&_td]:border-gray-700 dark:[&_td]:text-gray-300",

  // CKEditor size classes the sanitizer preserves
  "[&_.text-tiny]:text-xs [&_.text-small]:text-[0.8125rem] [&_.text-big]:text-base [&_.text-huge]:text-lg",
].join(" ");

// ── Images with fallback ────────────────────────────────────────────────────

/** A 404 on /media/ otherwise renders a broken-image icon with the alt text
 *  sprawled across the layout. */
function HeroImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className="h-2 w-full bg-gradient-to-r from-green-600 to-teal-500" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className="w-full object-cover" />
  );
}

function Thumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="h-12 w-12 shrink-0 rounded bg-gradient-to-br from-green-600 to-teal-500" />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded object-cover"
      loading="lazy"
    />
  );
}

// ── Sidebar widgets ─────────────────────────────────────────────────────────

function RelatedArticles({ posts }: { posts: RelatedPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">Related Articles</h3>
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="flex gap-3">
            <Thumb src={imageUrl(p.featured_image)} />
            <div className="min-w-0">
              <Link
                href={`/blogs/${p.slug}`}
                className="text-xs font-medium leading-snug text-gray-700 hover:text-[#e6007e] dark:text-gray-200 dark:hover:text-pink-400"
              >
                {p.title}
              </Link>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {formatDate(p.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StayUpdated() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const subscribe = async () => {
    if (!email.trim()) {
      setMessage("Enter your email address.");
      return;
    }
    setState("sending");
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Backend returns {"email": ["This email is already subscribed."]}
        const detail =
          (Array.isArray(data?.email) && data.email[0]) ||
          data?.detail ||
          "Subscription failed. Try again.";
        setMessage(detail);
        setState("idle");
        return;
      }
      setState("done");
      setMessage("You're subscribed.");
      setEmail("");
    } catch {
      setMessage("Network error. Try again.");
      setState("idle");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-1.5 text-sm font-bold text-gray-900 dark:text-white">Stay Updated</h3>
      <p className="mb-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Get the latest tech news and updates delivered to your inbox.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") subscribe();
        }}
        placeholder="Enter your email"
        className="mb-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
      />
      <button
        type="button"
        onClick={subscribe}
        disabled={state === "sending" || state === "done"}
        className="w-full rounded-md bg-gradient-to-r from-green-600 to-teal-500 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state === "sending" ? "Subscribing..." : state === "done" ? "Subscribed" : "Subscribe"}
      </button>
      {message && (
        <p
          className={`mt-2 text-xs ${
            state === "done" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function NeedHelp() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-1.5 text-sm font-bold text-gray-900 dark:text-white">Need Help?</h3>
      <p className="mb-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        Have questions about 5G coverage in your area? Our support team is here to help.
      </p>
      <Link
        href="/contact-us"
        className="block w-full rounded-md bg-[#e6007e] py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-[#c4007a]"
      >
        Contact Support
      </Link>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

function BlogDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Strip theme-hostile inline styles AND rewrite relative /media/ image
  // paths so they resolve against the API server, not the frontend domain.
  const cleanHtml = useMemo(() => {
    if (!post) return "";
    let html = sanitizeArticleHtml(post.content);
    // Rewrite src="/media/..." → src="https://api.zoikomobile.co.uk/media/..."
    html = html.replace(
      /src=["'](\/media\/[^"']+)["']/g,
      `src="${API_BASE}$1"`
    );
    return html;
  }, [post]);

  useEffect(() => {
    if (!slug) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/blog/posts/${slug}/`);
        if (res.status === 404) throw new Error("This post doesn't exist or isn't published yet.");
        if (!res.ok) throw new Error(`Failed to load post (${res.status})`);
        setPost(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    })();

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blog/posts/${slug}/related/`);
        if (!res.ok) return;
        const data: RelatedPost[] = await res.json();
        setRelated(Array.isArray(data) ? data : []);
      } catch {
        // Related articles are optional — fail quietly.
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (post) document.title = post.seo_title || post.title;
  }, [post]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-900">
        <p className="text-base font-bold text-gray-900 dark:text-white">Post not found</p>
        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {error ?? "We couldn't load this article."}
        </p>
        <Link
          href="/blogs"
          className="mt-5 rounded-md bg-[#e6007e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]"
        >
          Back to all blogs
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* JSON-LD Schema — BlogPosting (dynamic per post) */}
      <Script
        id={`schema-blog-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.seo_description || post.excerpt,
            "url": `https://zoikomobile.co.uk/blogs/${post.slug}`,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://zoikomobile.co.uk/blogs/${post.slug}`
            },
            "publisher": {
              "@type": "Organization",
              "name": "Zoiko Mobile UK",
              "url": "https://zoikomobile.co.uk/"
            },
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "datePublished": post.created_at,
            "dateModified": post.updated_at,
            ...(post.featured_image && {
              "image": imageUrl(post.featured_image)
            }),
            ...(post.seo_keywords && {
              "keywords": post.seo_keywords.split(",").map((k: string) => k.trim())
            })
          })
        }}
      />

      {/* Title banner — min-h stops it collapsing to a thin strip */}
      <div className="flex min-h-[180px] items-center bg-gradient-to-r from-green-600 to-teal-500 px-4 py-10">
        <div className="mx-auto w-full max-w-6xl">
          <p className="mb-3 text-xs text-white/80">
            {formatDate(post.created_at)}
            <span className="ml-4">{formatTime(post.created_at)}</span>
          </p>
          <h1 className="max-w-3xl text-2xl font-bold leading-snug text-white sm:text-3xl">
            {post.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Article — genuinely themed, light and dark both work */}
          <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <HeroImage src={imageUrl(post.featured_image)} alt={post.title} />

            <div className="p-6 sm:p-8">
              <div
                className={ARTICLE_CLASSES}
                dangerouslySetInnerHTML={{ __html: cleanHtml }}
              />

              <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500">By {post.author}</p>
                <Link
                  href="/blogs"
                  className="text-xs font-semibold text-[#e6007e] hover:underline dark:text-pink-400"
                >
                  Back to all blogs
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <RelatedArticles posts={related} />
            <StayUpdated />
            <NeedHelp />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BlogDetail;
export { BlogDetail };