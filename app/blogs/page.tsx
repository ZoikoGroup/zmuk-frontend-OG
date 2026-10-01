"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";

// .env.local -> NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

/** GET /api/blog/posts/ (BlogPostListSerializer — no `content`) */
export interface BlogListItem {
  id: number;
  title: string;
  slug: string;
  author: string;
  featured_image: string | null;
  excerpt: string;
  seo_description: string | null;
  created_at: string;
}

/** DRF PageNumberPagination wrapper (settings.py -> PAGE_SIZE: 9) */
interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── helpers ─────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function imageUrl(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${API_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

// ── card ────────────────────────────────────────────────────────────────────

function CardImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  // A 404 on /media/ otherwise renders a broken-image icon with the alt text
  // sprawled across the card. Fall back to the brand gradient instead.
  if (!src || failed) {
    return (
      <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-green-600 to-teal-500">
        <span className="px-4 text-center text-xs font-semibold text-white/90">{alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-48 w-full object-cover"
      loading="lazy"
    />
  );
}

function BlogCard({ post }: { post: BlogListItem }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <Link href={`/blogs/${post.slug}`} className="block">
        <CardImage src={imageUrl(post.featured_image)} alt={post.title} />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-1.5 text-sm font-bold leading-snug text-gray-800 dark:text-white">
          <Link href={`/blogs/${post.slug}`} className="hover:text-[#e6007e]">
            {post.title}
          </Link>
        </h2>

        <time
          dateTime={post.created_at}
          className="mb-2 block text-xs text-gray-400 dark:text-gray-500"
        >
          {formatDate(post.created_at)}
        </time>

        <p className="mb-5 flex-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {post.excerpt}
        </p>

        <Link
          href={`/blogs/${post.slug}`}
          className="mt-auto block w-full rounded-md bg-[#e6007e] py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[#c4007a]"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}

// ── page ────────────────────────────────────────────────────────────────────

function Blogs() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blog/posts/`);
        if (!res.ok) throw new Error(`Failed to load blogs (${res.status})`);
        const data: Paginated<BlogListItem> | BlogListItem[] = await res.json();

        // Tolerate both shapes in case pagination is disabled later
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          setPosts(data.results ?? []);
          setNextUrl(data.next);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const res = await fetch(nextUrl);
      if (!res.ok) throw new Error("Failed to load more posts");
      const data: Paginated<BlogListItem> = await res.json();
      setPosts((prev) => [...prev, ...(data.results ?? [])]);
      setNextUrl(data.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* JSON-LD Schema — Blog listing */}
      <Script
        id="schema-blog-list"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Zoiko Mobile UK Blog",
            "description": "Latest news, guides and updates from Zoiko Mobile UK.",
            "url": "https://zoikomobile.co.uk/blogs",
            "publisher": {
              "@type": "Organization",
              "name": "Zoiko Mobile UK",
              "url": "https://zoikomobile.co.uk/"
            }
          })
        }}
      />

      {/* Banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Zoiko&rsquo;s Latest Tech Tea
        </h1>
        <p className="mt-1 text-sm font-medium text-white/90">On the Digital Pulse!</p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && (
          <div className="flex justify-center py-16">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent"
              role="status"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No posts yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add a post in the Django admin and set its status to Published.
            </p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {nextUrl && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-md border-2 border-[#e6007e] px-8 py-2.5 text-sm font-semibold text-[#e6007e] transition-colors hover:bg-[#e6007e] hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more posts"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Blogs;
export { Blogs };