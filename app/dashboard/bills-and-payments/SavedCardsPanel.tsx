"use client";

// Saved payment methods panel for Bills & payments.
// Card details are typed into Stripe's Payment Element, never into our own inputs.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2, Plus, X } from "lucide-react";
import {
  cardBrandLabel,
  cardErrorMessage,
  cardExpiryLabel,
  confirmCardSetup,
  listSavedCards,
  removeCard,
  setDefaultCard,
  startCardSetup,
  type SavedCard,
  type SavedCardsList,
} from "../../utils/savedCardsApi";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const NOTHING_TAKEN = "We couldn't save your card. No payment has been taken. Please try again or use another card.";

function AddCardForm({ onSaved, onError }: { onSaved: (message: string) => void; onError: (m: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!stripe || !elements || busy) return;
    setBusy(true);
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/dashboard/bills-and-payments?card_setup=1` },
    });
    if (error || !setupIntent) {
      setBusy(false);
      onError(error?.message || NOTHING_TAKEN);
      return;
    }
    const res = await confirmCardSetup(setupIntent.id);
    setBusy(false);
    if (res.ok) onSaved(res.data?.message || "Card added. No payment has been taken.");
    else onError(cardErrorMessage(res));
  }

  return (
    <div className="flex flex-col gap-3.5">
      <PaymentElement />
      <button
        type="button"
        disabled={busy || !stripe}
        onClick={save}
        className="w-full px-4 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        Save card (no payment taken)
      </button>
    </div>
  );
}

export default function SavedCardsPanel({
  addOpen,
  setAddOpen,
  onLoaded,
  onToast,
}: {
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  onLoaded?: (list: SavedCardsList) => void;
  onToast?: (message: string, type: "success" | "info") => void;
}) {
  const [list, setList] = useState<SavedCardsList | null>(null);
  const cardListRef = useRef<HTMLDivElement>(null);
  const [consent, setConsent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [addError, setAddError] = useState("");

  // remove / set default confirmation
  const [manage, setManage] = useState<SavedCard | null>(null);
  const [action, setAction] = useState<null | { kind: "remove" | "default"; card: SavedCard }>(null);
  const [password, setPassword] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const refresh = useCallback(async () => {
    const l = await listSavedCards();
    setList(l);
    onLoaded?.(l);
    return l;
  }, [onLoaded]);

  useEffect(() => {
    let cancelled = false;
    listSavedCards().then((l) => {
      if (cancelled) return;
      setList(l);
      onLoaded?.(l);
    });
    return () => {
      cancelled = true;
    };
  }, [onLoaded]);

  // A card that redirected for 3-D Secure comes back with ?setup_intent=seti_...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const seti = params.get("setup_intent");
    if (!seti) return;
    (async () => {
      const res = await confirmCardSetup(seti);
      onToast?.(res.ok ? res.data?.message || "Card added. No payment has been taken." : cardErrorMessage(res), res.ok ? "success" : "info");
      window.history.replaceState({}, "", window.location.pathname);
      refresh();
    })();
    // run once on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeAdd = () => {
    setAddOpen(false);
    setConsent(false);
    setClientSecret(null);
    setAddError("");
  };

  const startAdd = async () => {
    if (!list?.consent || !consent || starting) return;
    setStarting(true);
    setAddError("");
    const res = await startCardSetup(list.consent.version);
    setStarting(false);
    if (res.ok && res.data?.client_secret) {
      setClientSecret(res.data.client_secret);
      return;
    }
    if (res.data?.code === "CONSENT_OUTDATED" || res.data?.code === "LIMIT_REACHED") {
      await refresh();
      setConsent(false);
    }
    if (res.data?.code === "SAVED_CARDS_UNAVAILABLE") {
      closeAdd();
      await refresh();
      return;
    }
    setAddError(cardErrorMessage(res));
  };

  const runAction = async () => {
    if (!action || !list) return;
    if (list.password_required && !password) {
      setActionError("Please enter your password.");
      return;
    }
    setActionBusy(true);
    setActionError("");
    const pw = list.password_required ? password : undefined;
    const res = action.kind === "remove" ? await removeCard(action.card.id, pw) : await setDefaultCard(action.card.id, pw);
    setActionBusy(false);
    if (res.ok) {
      onToast?.(action.kind === "remove" ? "Card removed." : "Default card updated.", "success");
      setAction(null);
      setPassword("");
      await refresh();
      return;
    }
    const code = res.data?.code;
    if (code === "REAUTH_REQUIRED") {
      window.location.assign(`/login?next=${encodeURIComponent("/dashboard/bills-and-payments")}`);
      return;
    }
    if (code === "PAYMENT_METHOD_NOT_FOUND") {
      setAction(null);
      await refresh();
    }
    setActionError(cardErrorMessage(res));
  };

  // Feature off or not logged in: show nothing saved-card related.
  if (!list) return null;
  // Guide 3.1: enabled === false -> hide everything saved-card related.
  if (!list.enabled) return null;
  /* PREVIOUS: showed a "Saved cards aren't available right now" placeholder and a disabled
     "Add or replace a card" button when the feature was off.
    // Guide says hide saved-card UI here. We show a quiet placeholder so the card is never an empty box.
    return (
      <div className="flex flex-col gap-2.5">
        <div className="p-3.5 rounded-2xl border border-[#121E3E]/10 text-xs text-[#54617E]">
          Saved cards aren&apos;t available right now. Please log in, or try again later.
        </div>
        <button
          type="button"
          disabled
          className="w-full px-3.5 py-2 rounded-xl border border-[#E01C5B]/25 inline-flex items-center justify-center gap-1.5 text-[#E01C5B] text-xs font-semibold opacity-50 cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add a card</span>
        </button>
      </div>
    );
  */

  return (
    <>
      <div className="flex flex-col gap-2.5" ref={cardListRef}>
        {list.payment_methods.length === 0 ? (
          <div className="p-3.5 rounded-2xl border border-[#121E3E]/10 text-xs text-[#54617E]">
            No saved cards. Add a card to pay faster next time.
          </div>
        ) : (
          list.payment_methods.map((c) => (
            <div key={c.id} className="p-3.5 rounded-2xl border border-[#121E3E]/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-8 bg-[#1D3A70] rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-extrabold tracking-wider uppercase italic">{c.brand || "card"}</span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[#0D1935] text-sm font-bold leading-5">
                    {cardBrandLabel(c.brand)} ••••{c.last4}
                  </span>
                  <span className="text-[#54617E] text-xs leading-4">
                    Expires {cardExpiryLabel(c)}
                  </span>
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#F4F5F8] rounded-full text-[#54617E] text-[11px] font-semibold">
                      One-off payments &amp; add-ons
                    </span>
                    {c.is_default && (
                      <span className="px-2 py-0.5 bg-[#1E8E5A]/10 rounded-full text-[#1E8E5A] text-[11px] font-semibold">Default</span>
                    )}
                    {c.expired && (
                      <span className="px-2 py-0.5 bg-rose-50 rounded-full text-rose-600 text-[11px] font-semibold">Expired</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManage(c)}
                className="text-[#E01C5B] text-xs font-semibold hover:underline shrink-0 cursor-pointer"
              >
                Manage
              </button>
            </div>
          ))
        )}

        {list.can_add ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="w-full px-3.5 py-2 rounded-xl border border-[#E01C5B]/25 hover:bg-[#E01C5B]/5 inline-flex items-center justify-center gap-1.5 text-[#E01C5B] text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add a card</span>
          </button>
        ) : (
          <>
            {/* Guide 4.1: when the maximum is reached, show "Manage payment methods" instead of "Add a card". */}
            <button
              type="button"
              onClick={() => cardListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#E01C5B]/25 hover:bg-[#E01C5B]/5 inline-flex items-center justify-center gap-1.5 text-[#E01C5B] text-xs font-semibold cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Manage payment methods</span>
            </button>
            <p className="text-[11px] text-[#54617E]">
              You have {list.limit} saved cards, the maximum. Remove one to add another.
            </p>
          </>
        )}
      </div>

      {/* Add a card */}
      {addOpen && list.can_add && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">Add a card</h3>
                <p className="text-xs text-[#54617E] mt-0.5">Save a payment card securely to make future payments faster.</p>
              </div>
              <button type="button" onClick={closeAdd} aria-label="Close" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 flex flex-col gap-3.5">
              {!clientSecret && (
                <>
                  <label className="flex items-start gap-2.5 text-xs text-[#0D1935] cursor-pointer">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#E01C5B]" />
                    <span>{list.consent?.text}</span>
                  </label>
                  <button
                    type="button"
                    disabled={!consent || starting}
                    onClick={startAdd}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {starting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Continue to card details
                  </button>
                </>
              )}

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <AddCardForm
                    onSaved={async (m) => {
                      onToast?.(m, "success");
                      closeAdd();
                      await refresh();
                    }}
                    onError={async (m) => {
                      setAddError(m);
                      await refresh();
                    }}
                  />
                </Elements>
              )}

              {addError && <p className="text-xs text-rose-500 font-medium">{addError}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Manage a card: choose set as default / remove */}
      {manage && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-[#0D1935]">
                {cardBrandLabel(manage.brand)} ••••{manage.last4}
              </h3>
              <button type="button" onClick={() => setManage(null)} aria-label="Close" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {!manage.is_default && (
                <button
                  type="button"
                  onClick={() => {
                    setAction({ kind: "default", card: manage });
                    setManage(null);
                    setPassword("");
                    setActionError("");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E01C5B]/25 hover:bg-[#E01C5B]/5 text-[#E01C5B] text-sm font-semibold cursor-pointer"
                >
                  Set as default
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setAction({ kind: "remove", card: manage });
                  setManage(null);
                  setPassword("");
                  setActionError("");
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500 text-sm font-semibold cursor-pointer"
              >
                Remove card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove / set default */}
      {action && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-[#0D1935]">
              {action.kind === "remove"
                ? `Remove ${cardBrandLabel(action.card.brand)} •••• ${action.card.last4}?`
                : `Make ${cardBrandLabel(action.card.brand)} •••• ${action.card.last4} your default card?`}
            </h3>
            {list.password_required && (
              <div className="mt-3 flex flex-col gap-1">
                <label htmlFor="card-action-password" className="text-xs font-semibold text-[#0D1935]">
                  Enter your password to confirm
                </label>
                <input
                  id="card-action-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#E01C5B] text-sm focus:outline-none"
                />
              </div>
            )}
            {actionError && <p className="mt-2 text-xs text-rose-500 font-medium">{actionError}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setAction(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-[#54617E] hover:bg-slate-100 cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={runAction}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] disabled:opacity-60 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
              >
                {actionBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {action.kind === "remove" ? "Remove card" : "Set as default"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
