"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/**
 * Landing page for the unsubscribe link in newsletter emails.
 *
 * The backend does the actual work. GET /api/newsletter/unsubscribe/<token>/
 * verifies the signed token, sets Subscriber.is_active = False, then redirects
 * here with ?status=ok or ?status=invalid.
 *
 * This page only reports the outcome — it never calls the API itself, so
 * refreshing or sharing the URL cannot unsubscribe anyone.
 */

function Icon({ ok }: { ok: boolean }) {
  return (
    <div
      className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
        ok ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
      }`}
    >
      {ok ? (
        <svg
          className="h-8 w-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="h-8 w-8 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
    </div>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const ok = status === "ok";

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Icon ok={ok} />

      {ok ? (
        <>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            You&rsquo;ve been unsubscribed
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            You won&rsquo;t receive any more article updates from Zoiko Mobile.
            Changed your mind? You can resubscribe from the form on any article
            page.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            This link didn&rsquo;t work
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            The unsubscribe link is invalid, incomplete, or has been altered.
            Some email clients break long links across lines — try clicking it
            again from the original email, or contact us and we&rsquo;ll remove
            you manually.
          </p>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/blogs"
          className="rounded-md bg-[#e6007e] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c4007a]"
        >
          Back to articles
        </Link>
        {!ok && (
          <Link
            href="/contact-us"
            className="rounded-md border-2 border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 dark:border-gray-600 dark:text-gray-300"
          >
            Contact support
          </Link>
        )}
      </div>
    </div>
  );
}

/** Skeleton shown while the Suspense boundary resolves. */
function Fallback() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mx-auto mb-5 h-16 w-16 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700" />
      <div className="mx-auto mb-3 h-5 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      <div className="mx-auto h-4 w-5/6 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Email Preferences
        </h1>
      </div>

      <div className="flex min-h-[50vh] items-start justify-center px-4 py-12">
        {/* useSearchParams() requires a Suspense boundary in the App Router.
            Without it, `next build` fails with a prerender error on this route. */}
        <Suspense fallback={<Fallback />}>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  );
}