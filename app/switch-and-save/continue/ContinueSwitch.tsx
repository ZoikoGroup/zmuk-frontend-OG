"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Download, ExternalLink, FileText, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import StripePaymentForm, { type StripePaymentFormRef } from "@/app/components/StripePaymentForm";
import {
  SwitchApiError,
  checkContinueLink,
  claimContinueLink,
  confirmSwitchPayment,
  consentToDocuments,
  createDocumentPack,
  downloadDocument,
  fetchDocumentPack,
  fetchOrderDocuments,
  fetchOrderReview,
  hasSwitchSession,
  openDocument,
  persistSwitchSession,
  resendContinueLink,
  startSwitchCheckout,
  type ContinueCheck,
  type DocumentPack,
  type OrderDocuments,
  type OrderReview,
  type SwitchCheckout,
} from "../switchApi";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// The link token lives in sessionStorage only (never logged, never put in analytics).
const TOKEN_KEY = "zoiko_switch_continue_token";

type Phase = "loading" | "error" | "signin" | "review" | "pay" | "done";

const PINK = "bg-[#E01C5B] hover:bg-[#c9144e]";

function money(v: string | number | undefined | null) {
  const n = Number(v);
  return Number.isFinite(n) ? `£${n.toFixed(2)}` : "—";
}

function errMsg(e: unknown, fallback: string) {
  return e instanceof SwitchApiError ? e.message : fallback;
}

export default function ContinueSwitch() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<{ code: string | null; message: string } | null>(null);

  const [reference, setReference] = useState<string | null>(null);
  const [check, setCheck] = useState<ContinueCheck | null>(null);

  const [review, setReview] = useState<OrderReview | null>(null);
  const [pack, setPack] = useState<DocumentPack | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsErrorCode, setDocsErrorCode] = useState<string | null>(null);
  const [offered, setOffered] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState(false);

  const [checkout, setCheckout] = useState<SwitchCheckout | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const [orderDocs, setOrderDocs] = useState<OrderDocuments | null>(null);
  const [orderDocsError, setOrderDocsError] = useState<string | null>(null);

  const [resendRef, setResendRef] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const payRef = useRef<StripePaymentFormRef>(null);
  const started = useRef(false);

  const loginHref = `/login?next=${encodeURIComponent(
    reference ? `/switch-and-save/continue?reference=${reference}` : "/switch-and-save/continue"
  )}`;

  // ── Documents (B2) ─────────────────────────────────────────────────────────
  const loadDocuments = useCallback(async (ref: string) => {
    setDocsError(null);
    setDocsErrorCode(null);
    try {
      const p = await createDocumentPack(ref);
      setPack(p);
      setOffered({});
      setAgreed(Boolean(p.consented));
    } catch (e) {
      setPack(null);
      setDocsErrorCode(e instanceof SwitchApiError ? e.code : null);
      setDocsError(errMsg(e, "We can’t complete your contract documents right now. Your request is saved. We’ll contact you when you can continue."));
      if (e instanceof SwitchApiError && e.code === "CODE_EXPIRED") setError({ code: e.code, message: e.message });
    }
  }, []);

  const loadReview = useCallback(
    async (ref: string) => {
      setReference(ref);
      persistSwitchSession({ reference: ref, email: "", updatedAt: new Date().toISOString() });
      try {
        const r = await fetchOrderReview(ref);
        setReview(r);
        setPhase("review");
        if (r.documents_available) await loadDocuments(ref);
      } catch (e) {
        if (e instanceof SwitchApiError && e.status === 409 && e.code === "ALREADY_ORDERED") {
          await showDone(ref);
          return;
        }
        setError({ code: e instanceof SwitchApiError ? e.code : null, message: errMsg(e, "We couldn’t load your order.") });
        setPhase("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadDocuments]
  );

  async function showDone(ref: string) {
    setPhase("done");
    setOrderDocsError(null);
    try {
      setOrderDocs(await fetchOrderDocuments(ref));
    } catch (e) {
      setOrderDocs(null);
      setOrderDocsError(errMsg(e, "We couldn’t load your documents yet. Please refresh in a moment."));
    }
  }

  // ── Entry (B1) ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      let token: string | null = null;
      try {
        const fromUrl = params.get("token");
        if (fromUrl) {
          sessionStorage.setItem(TOKEN_KEY, fromUrl);
          window.history.replaceState(null, "", window.location.pathname);
        }
        token = sessionStorage.getItem(TOKEN_KEY);
      } catch {
        token = params.get("token");
      }
      const refParam = params.get("reference");
      const signedIn = hasSwitchSession();

      if (!token) {
        if (!refParam) {
          setError({ code: "INVALID_LINK", message: "This link isn’t valid. Request a new one below." });
          setPhase("error");
          return;
        }
        if (!signedIn) {
          setReference(refParam);
          setPhase("signin");
          return;
        }
        await loadReview(refParam);
        return;
      }

      try {
        const c = await checkContinueLink(token);
        setCheck(c);
        setReference(c.reference);
        if (c.sign_in_required || !signedIn) {
          setPhase("signin");
          return;
        }
        const st = await claimContinueLink(token);
        try {
          sessionStorage.removeItem(TOKEN_KEY);
        } catch {}
        await loadReview(st.reference || c.reference);
      } catch (e) {
        const code = e instanceof SwitchApiError ? e.code : null;
        if (code === "LINK_USED" && signedIn) {
          // The link is used up; if it was this account's, the order screen is still reachable.
          const ref = check?.reference || refParam;
          if (ref) {
            await loadReview(ref);
            return;
          }
        }
        setError({ code, message: errMsg(e, "We couldn’t open your link. Please try again.") });
        setPhase("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const bothOffered = Boolean(pack && pack.documents.length > 0 && pack.documents.every((d) => offered[d.id]));
  const expired = Boolean(pack && Date.parse(pack.offer_valid_until) < Date.now());

  async function viewDoc(d: DocumentPack["documents"][number]) {
    try {
      await openDocument(d.download_url);
      setOffered((o) => ({ ...o, [d.id]: true }));
    } catch (e) {
      setActionError(errMsg(e, "We couldn’t open that document."));
    }
  }
  async function saveDoc(d: DocumentPack["documents"][number]) {
    try {
      await downloadDocument(d.download_url, d.filename || `${d.kind}.pdf`);
      setOffered((o) => ({ ...o, [d.id]: true }));
    } catch (e) {
      setActionError(errMsg(e, "We couldn’t download that document."));
    }
  }

  async function handleConfirmAndPay() {
    if (!reference || !pack || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      if (!pack.consented) {
        const updated = await consentToDocuments(reference, pack);
        setPack({ ...pack, ...updated, consented: true });
      }
      const co = await startSwitchCheckout(reference);
      setCheckout(co);
      if (!co.payment_required || !co.client_secret) {
        await showDone(reference);
        return;
      }
      setPhase("pay");
    } catch (e) {
      const code = e instanceof SwitchApiError ? e.code : null;
      const msg = errMsg(e, "We couldn’t start your payment. Nothing has been charged.");
      if (code === "DOCUMENTS_MISMATCH") {
        const p = await fetchDocumentPack(reference).catch(() => null);
        setPack(p);
        setOffered({});
        setAgreed(false);
      } else if (code === "DOCUMENTS_EXPIRED" || code === "PRICE_CHANGED") {
        setAgreed(false);
        const fresh = await fetchOrderReview(reference).catch(() => null);
        if (fresh) setReview(fresh);
        await loadDocuments(reference);
      } else if (code === "CONSENT_REQUIRED") {
        setAgreed(false);
      } else if (code === "ALREADY_ORDERED") {
        await showDone(reference);
        return;
      } else if (code === "REAUTH_REQUIRED" || code === "EMAIL_NOT_VERIFIED") {
        // The backend wants a recent sign-in (or a verified email) before taking payment.
        setNeedsSignIn(true);
      }
      setActionError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (!reference || !checkout || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await payRef.current?.submitPayment();
      if (!res?.success) {
        setActionError(res?.error || "Payment was not completed. You haven’t been charged.");
        return;
      }
      // The Stripe webhook also confirms; if this call is early the page just shows the current state.
      await confirmSwitchPayment(checkout.confirm_url).catch(() => {});
      await showDone(reference);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendMsg(null);
    try {
      setResendMsg(await resendContinueLink(resendRef.trim(), resendEmail.trim()));
    } catch (err) {
      setResendMsg(errMsg(err, "We couldn’t send a new link right now."));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#F4F6F9] px-4 py-10 sm:py-14 font-sans text-[#0D1935]">
      <div className="mx-auto max-w-2xl space-y-5">{children}</div>
    </div>
  );
  const card = "bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs";

  if (phase === "loading") {
    return shell(
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#E01C5B]" />
      </div>
    );
  }

  if (phase === "signin") {
    return shell(
      <div className={`${card} space-y-4`}>
        <h1 className="text-2xl font-extrabold">Sign in or create an account to continue</h1>
        <p className="text-sm text-slate-600">
          {check?.plan?.name ? <>Your switch to <strong>{check.plan.name}</strong> is ready for the next step. </> : null}
          {check?.email_masked ? <>Use the email address <strong>{check.email_masked}</strong>.</> : "Use the email address you gave us."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={loginHref} className={`rounded-xl ${PINK} px-5 py-2.5 text-sm font-bold text-white`}>
            Sign in or register
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "error" && error) {
    const canResend = ["INVALID_LINK", "LINK_EXPIRED", "LINK_USED"].includes(error.code || "");
    return shell(
      <div className={`${card} space-y-4`}>
        {error.code === "NOT_AVAILABLE" ? (
          <>
            <h1 className="text-2xl font-extrabold">Continuing online isn’t available yet</h1>
            <p className="text-sm text-slate-600">
              Your switching request is saved and nothing has been charged. We’ll contact you when you can continue. You can
              still track your request or send your PAC code later.
            </p>
            <Link href="/switch-and-save" className={`inline-block rounded-xl ${PINK} px-5 py-2.5 text-sm font-bold text-white`}>
              Go to your switch request
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold">We couldn’t continue your switch</h1>
            <p className="text-sm text-slate-600">{error.message}</p>
          </>
        )}

        {error.code === "LINK_USED" && !hasSwitchSession() && (
          <Link href={loginHref} className={`inline-block rounded-xl ${PINK} px-5 py-2.5 text-sm font-bold text-white`}>
            Sign in to continue
          </Link>
        )}
        {error.code === "EMAIL_NOT_VERIFIED" && (
          <p className="text-xs text-slate-500">Verify your email address from the link we sent you, then open your continue link again.</p>
        )}
        {(error.code === "REQUEST_NOT_READY" || error.code === "CODE_EXPIRED") && (
          <Link href="/switch-and-save" className={`inline-block rounded-xl ${PINK} px-5 py-2.5 text-sm font-bold text-white`}>
            Go to your switch request
          </Link>
        )}
        {error.code === "REQUEST_BELONGS_TO_ANOTHER_ACCOUNT" && (
          <Link href="/support" className="text-sm font-semibold text-[#E01C5B] underline">Contact support</Link>
        )}

        {canResend && (
          <form onSubmit={handleResend} className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold">Send me a new link</p>
            <input
              value={resendRef}
              onChange={(e) => setResendRef(e.target.value)}
              placeholder="Reference, e.g. ZM-SW-7K3F9Q2X"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              required
            />
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              required
            />
            <button type="submit" className={`rounded-xl ${PINK} px-5 py-2.5 text-sm font-bold text-white`}>
              Send me a new link
            </button>
            {resendMsg && <p className="text-xs text-slate-600">{resendMsg}</p>}
          </form>
        )}
      </div>
    );
  }

  // ── Review & documents (B2) + agree & pay (B3) ─────────────────────────────
  if (phase === "review" && review) {
    const q = pack?.quote || review.quote;
    return shell(
      <>
        <div className={`${card} space-y-5`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Review your plan and contract documents</h1>
            <p className="mt-1 text-xs text-slate-500">
              Reference <span className="font-mono font-bold">{review.reference}</span>
            </p>
          </div>

          <div className="rounded-xl bg-[#FDE8F1]/60 border border-[#E01C5B]/20 p-4">
            <p className="text-lg font-extrabold">
              Your plan costs {money(q.monthly_price)} per month, including VAT
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              {review.plan.name} · {review.plan.data_allowance} · {q.term_label} · {review.sim_type === "esim" ? "eSIM" : "Physical SIM"}
            </p>
            {Number(q.charge_today) > 0 && (
              <p className="mt-1 text-xs text-slate-600">Due today: {money(q.charge_today)}</p>
            )}
          </div>

          {review.price_changed && review.submitted_price && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
              The price has changed since you sent your request. It was{" "}
              <strong>{money(review.submitted_price.monthly_price)}</strong> a month and is now{" "}
              <strong>{money(review.quote.monthly_price)}</strong> a month.
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {review.port_number_masked && (
              <div>
                <dt className="text-xs text-slate-500">Number being switched</dt>
                <dd className="font-semibold">{review.port_number_masked}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-slate-500">Billing address</dt>
              <dd className="font-semibold">
                {[review.billing_address.address_line_1, review.billing_address.address_line_2, review.billing_address.town_city, review.billing_address.postcode]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          </dl>
        </div>

        {!review.documents_available || (!pack && docsError) ? (
          <div className={`${card} space-y-2`}>
            <p className="text-sm font-semibold text-red-700">
              {docsError || "We can’t complete your contract documents right now. Your request is saved. We’ll contact you when you can continue."}
            </p>
            <p className="text-xs text-slate-500">You can’t continue until the documents are ready. Please try again later.</p>
            {review.documents_available && docsErrorCode !== "DOCUMENTS_UNAVAILABLE" && (
              <button
                onClick={() => reference && loadDocuments(reference)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            )}
          </div>
        ) : !pack ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#E01C5B]" />
          </div>
        ) : (
          <div className={`${card} space-y-4`}>
            <div className="space-y-3">
              {[...pack.documents]
                .sort((a, b) => (a.kind === "contract_information" ? -1 : b.kind === "contract_information" ? 1 : 0))
                .map((d) => (
                  <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 text-[#E01C5B]" />
                      <div>
                        <p className="text-sm font-bold">{d.title}</p>
                        <p className="text-xs text-slate-500">
                          {d.kind === "contract_information"
                            ? "Detailed information about your plan, charges, service and your rights."
                            : d.kind === "contract_summary"
                            ? "The main terms of your plan in one page."
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => viewDoc(d)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                        <ExternalLink className="h-3.5 w-3.5" /> View PDF
                      </button>
                      <button onClick={() => saveDoc(d)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <p className="text-xs text-slate-600">
              {pack.email_status === "sent"
                ? `We've sent your contract documents to ${check?.email_masked || "your email address"}. You can also download them below.`
                : "Your contract documents are available to download. We'll confirm email delivery separately."}
            </p>

            {expired ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900 flex items-center justify-between gap-3">
                <span>These documents are no longer valid. Please get fresh ones.</span>
                <button onClick={() => reference && loadDocuments(reference)} className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white">
                  Refresh documents
                </button>
              </div>
            ) : (
              <label className={`flex items-start gap-3 text-sm ${bothOffered ? "cursor-pointer" : "opacity-60"}`}>
                <input
                  type="checkbox"
                  checked={agreed}
                  disabled={!bothOffered}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#E01C5B]"
                />
                <span>
                  I confirm that I have received the Contract Information and Contract Summary and agree to enter into the contract on the terms shown.
                  {!bothOffered && <span className="block text-xs text-slate-500">View or download both documents to continue.</span>}
                </span>
              </label>
            )}

            {actionError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}
            {needsSignIn && (
              <Link href={loginHref} className="inline-block text-sm font-semibold text-[#E01C5B] underline">
                Sign in again, then come back to continue
              </Link>
            )}

            <button
              onClick={handleConfirmAndPay}
              disabled={!agreed || !bothOffered || expired || busy}
              className={`w-full rounded-xl ${PINK} py-3 text-sm font-bold text-white disabled:opacity-50 inline-flex items-center justify-center gap-2`}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm and pay
            </button>
          </div>
        )}
      </>
    );
  }

  // ── Payment (B3) ───────────────────────────────────────────────────────────
  if (phase === "pay" && checkout?.client_secret) {
    return shell(
      <div className={`${card} space-y-5`}>
        <h1 className="text-2xl font-extrabold">Pay securely</h1>
        <p className="text-sm text-slate-600">
          Amount due today: <strong>{money(checkout.amount)}</strong> {checkout.currency}
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <Elements stripe={stripePromise} options={{ clientSecret: checkout.client_secret }} key={checkout.client_secret}>
            <StripePaymentForm
              ref={payRef}
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/switch-and-save/continue?reference=${encodeURIComponent(reference || "")}`}
            />
          </Elements>
        </div>
        {actionError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}
        <div className="flex items-center justify-between">
          <button onClick={() => setPhase("review")} className="text-sm font-semibold text-slate-600">Back</button>
          <button
            onClick={handlePay}
            disabled={busy}
            className={`rounded-xl ${PINK} px-6 py-3 text-sm font-bold text-white disabled:opacity-50 inline-flex items-center gap-2`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Pay {money(checkout.amount)}
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" /> Payments are processed securely by Stripe.
        </p>
      </div>
    );
  }

  // ── Documents & receipt (B4) ───────────────────────────────────────────────
  if (phase === "done") {
    const state = orderDocs?.payment.state;
    const placed = state === "paid" || state === "no_payment" || state === "partially_refunded" || state === "refunded";
    return shell(
      <div className={`${card} space-y-5`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {placed ? "Order placed" : "Switch request submitted"}
          </h1>
          {reference && (
            <p className="mt-1 text-xs text-slate-500">
              Reference <span className="font-mono font-bold">{reference}</span>
              {orderDocs?.order_reference ? <> · Order {orderDocs.order_reference}</> : null}
            </p>
          )}
        </div>

        {orderDocs ? (
          <>
            <p className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-sm">{orderDocs.payment.message}</p>

            {state === "failed" && (
              <button
                onClick={async () => {
                  if (!reference) return;
                  setBusy(true);
                  try {
                    const co = await startSwitchCheckout(reference);
                    setCheckout(co);
                    setPhase(co.client_secret ? "pay" : "done");
                  } catch (e) {
                    setActionError(errMsg(e, "We couldn’t restart your payment."));
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`rounded-xl ${PINK} px-5 py-2.5 text-sm font-bold text-white`}
              >
                Retry payment
              </button>
            )}

            {orderDocs.documents.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-extrabold">Your documents</h2>
                {orderDocs.documents.map((d) => (
                  <div key={d.kind} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                    <div>
                      <p className="text-sm font-bold">{d.title}</p>
                      {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openDocument(d.download_url).catch((e) => setActionError(errMsg(e, "We couldn’t open that document.")))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                        <ExternalLink className="h-3.5 w-3.5" /> View PDF
                      </button>
                      <button onClick={() => downloadDocument(d.download_url, d.filename || `${d.kind}.pdf`).catch((e) => setActionError(errMsg(e, "We couldn’t download that document.")))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-600">
                  {orderDocs.contract_email_status === "sent" && orderDocs.email_masked
                    ? `We've sent your documents to ${orderDocs.email_masked}.`
                    : "You can download them here."}
                </p>
              </div>
            )}
          </>
        ) : (
          orderDocsError && <p className="text-sm text-slate-600">{orderDocsError}</p>
        )}

        {actionError && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={() => reference && showDone(reference)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <Link href="/switch-and-save" className={`rounded-xl ${PINK} px-5 py-2 text-sm font-bold text-white`}>
            Track your switch
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
