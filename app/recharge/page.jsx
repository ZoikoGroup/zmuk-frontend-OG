"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { validateUkMobile } from "../utils/validators";
import {
  validatePhone,
  getProducts,
  createRechargeOrder,
  RechargeAPIError,
} from "./api";
import styles from "./recharge.module.css";

// Steps within the modal
const STEP_PLANS = "plans";
const STEP_PAYMENT = "payment";

// Visual progress pills (display only)
const TOPUP_STEPS = ["Your number", "Choose", "Review & pay", "Done"];

// TODO: confirm final FAQ copy with product/legal before launch.
const FAQS = [
  {
    q: "Can I top up someone else’s number?",
    a: "Enter the UK mobile number you want to top up. We check it securely first, and only show plan details for numbers that can be topped up.",
  },
  {
    q: "Does topping up change my plan?",
    a: "No. Topping up doesn’t change your plan. To choose a new plan, see all SIM-only plans.",
  },
  {
    q: "Will I be charged automatically?",
    a: "You’ll review the price before paying, and payment is taken on a secure Stripe checkout page.",
  },
  {
    q: "When does my top-up start?",
    a: "Your top-up is applied once your payment is confirmed. You’ll see the result on the confirmation page.",
  },
  {
    q: "I have a bill to pay",
    a: "Paying an outstanding bill is a separate option in My Zoiko — it isn’t a top-up. Sign in to My Zoiko to pay it.",
  },
];

export default function RechargePage() {
  // ── Phone + SIM state ───────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Signed-in customers don't need the "Sign in" prompt. Read after mount
  // (localStorage is client-only) to avoid a server/client mismatch.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    try {
      setSignedIn(
        !!(localStorage.getItem("zoiko_token") || localStorage.getItem("access_token"))
      );
    } catch {
      setSignedIn(false);
    }
  }, []);
  const [sim, setSim] = useState(null); // { phone_number, sim_card_id_masked, rechargeable, ... }

  // ── Modal state ──────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(STEP_PLANS);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ── Payment state ────────────────────────────────────────────────────
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  // ── Handlers: phone validation ───────────────────────────────────────
  async function handleValidate(e) {
    e.preventDefault();
    setPhoneTouched(true);
    if (!phone.trim() || !phoneCheck.isValid) return;

    setValidating(true);
    setValidateError("");
    setSim(null);

    try {
      const data = await validatePhone(phone.trim());
      if (data.success) {
        setSim(data.sim);
      } else {
        setValidateError(data.message || "Could not validate this number.");
      }
    } catch (err) {
      setValidateError(
        err instanceof RechargeAPIError
          ? err.message
          : "Failed to validate phone number. Please try again."
      );
    } finally {
      setValidating(false);
    }
  }

  function handleChangeNumber() {
    setSim(null);
    setValidateError("");
  }

  // ── Handlers: open modal + load plans ───────────────────────────────
  async function openPlanModal() {
    setModalOpen(true);
    setModalStep(STEP_PLANS);
    setSelectedPlan(null);
    setPayError("");

    setPlansLoading(true);
    setPlansError("");
    try {
      const data = await getProducts("recharge");
      if (data.success) {
        setPlans(data.products || []);
      } else {
        setPlansError("Could not load recharge plans.");
      }
    } catch (err) {
      setPlansError(
        err instanceof RechargeAPIError
          ? err.message
          : "Could not load recharge plans. Please try again."
      );
    } finally {
      setPlansLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
  }

  function handleSelectPlan(plan) {
    setSelectedPlan(plan);
    setModalStep(STEP_PAYMENT);
  }

  // ── Handlers: pay ────────────────────────────────────────────────────
  async function handlePayNow() {
    if (!selectedPlan || !sim) return;

    setPaying(true);
    setPayError("");

    try {
      const data = await createRechargeOrder({
        msisdn: sim.phone_number,
        productId: selectedPlan.id,
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setPayError("Could not start checkout. Please try again.");
        setPaying(false);
      }
    } catch (err) {
      setPayError(
        err instanceof RechargeAPIError
          ? err.message
          : "Payment could not be started. Please try again."
      );
      setPaying(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────
  const canRecharge = !!sim && sim.rechargeable;
  const phoneCheck = validateUkMobile(phone);
  const showPhoneError = phoneTouched && !!phone.trim() && !phoneCheck.isValid;
  // Display only: which progress pill is active.
  const currentStep = !sim
    ? 1
    : modalOpen && modalStep === STEP_PAYMENT
    ? 3
    : 2;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Already with Zoiko Mobile?</p>
          <h1 className={styles.heroTitle}>
            Top up your <span>Zoiko Mobile plan</span>
          </h1>
          <p className={styles.heroLead}>
            Renew your plan or add extra data to an eligible line. Sign in to
            see your current plan before you choose.
          </p>
          <ol className={styles.steps} aria-label="Top-up progress">
            {TOPUP_STEPS.map((label, i) => {
              const n = i + 1;
              const state =
                n < currentStep ? styles.stepDone : n === currentStep ? styles.stepActive : "";
              return (
                <li
                  key={label}
                  className={`${styles.stepPill} ${state}`}
                  aria-current={n === currentStep ? "step" : undefined}
                >
                  <span className={styles.stepNum}>{n}</span>
                  {label}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.wrap}>
        <div className={styles.grid}>
          <div className={styles.col}>
        <div className={styles.phoneForm}>
          <form onSubmit={handleValidate}>
            <h2 className={styles.cardTitle}>Top up with your mobile number</h2>
            <p className={styles.cardSub}>
              We&rsquo;ll check your number securely before showing any plan details.
            </p>
            <label className={styles.label} htmlFor="msisdn">
              UK mobile number <span className={styles.req}>*</span>
            </label>
            <p className={styles.hint}>For example 07700 900123</p>
            <div className={styles.phoneRow}>
              <div className={styles.phoneField}>
                <span className={styles.prefix} aria-hidden="true">+44</span>
                <input
                  id="msisdn"
                  type="tel"
                  className={styles.phoneInput}
                  placeholder="Enter your phone number"
                  value={phone}
                  disabled={validating || !!sim}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setValidateError("");
                  }}
                  onBlur={() => setPhoneTouched(true)}
                  aria-invalid={showPhoneError}
                  aria-describedby={showPhoneError ? "msisdn-error" : undefined}
                  autoComplete="tel"
                />
              </div>
              {!sim && (
                <button
                  type="submit"
                  className={styles.validateBtn}
                  disabled={validating || !phone.trim() || !phoneCheck.isValid}
                >
                  {validating ? "Validating…" : "Continue securely"}
                  {!validating && <span aria-hidden="true">›</span>}
                </button>
              )}
            </div>

            {!sim && (
              <div className={styles.secureNote}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <span>
                  We may ask you to verify that you own this number before
                  showing plan details. We never confirm whether a number
                  belongs to someone else.
                </span>
              </div>
            )}

            {showPhoneError && (
              <p id="msisdn-error" role="alert" className={styles.error}>
                {phoneCheck.error}
              </p>
            )}

            {validating && (
              <p className={styles.validating}>Validating phone number…</p>
            )}
            {validateError && <p className={styles.error}>{validateError}</p>}
            {sim && (
              <p className={styles.validated}>
                ✓ Phone number validated successfully!
              </p>
            )}
          </form>

          {sim && (
            <>
              <div className={styles.simTable}>
                <div className={styles.simTableHead}>SIM Details</div>
                <div className={styles.simRow}>
                  <span className={styles.simLabel}>Phone Number:</span>
                  <span className={styles.simVal}>{sim.phone_number}</span>
                </div>
                <div className={styles.simRow}>
                  <span className={styles.simLabel}>SIM Card ID:</span>
                  <span className={styles.simVal}>
                    {sim.sim_card_id_masked}
                  </span>
                </div>
              </div>

              {canRecharge ? (
                <button className={styles.rechargeBtn} onClick={openPlanModal}>
                  Recharge Now
                </button>
              ) : (
                <p className={styles.notRechargeable}>
                  This SIM is not currently eligible for recharge.
                </p>
              )}

              <div className={styles.resetRow}>
                <button className={styles.resetBtn} onClick={handleChangeNumber}>
                  Use a different number
                </button>
              </div>
            </>
          )}
        </div>

            {!signedIn && (
              <>
            <div className={styles.or}>or</div>

            <div className={`${styles.card} ${styles.signin}`}>
              <span className={styles.signinIcon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
              </span>
              <div className={styles.signinText}>
                <h3>Sign in to My Zoiko</h3>
                <p>
                  See all your lines, your current plan and what you can add.
                  You&rsquo;ll come straight back here after signing in.
                </p>
              </div>
              <Link href="/login" className={styles.outlineBtn}>
                Sign in <span aria-hidden="true">›</span>
              </Link>
            </div>
              </>
            )}
          </div>

          <aside className={styles.col}>
            <div className={styles.card}>
              <h2 className={styles.sideTitle}>What you can do</h2>
              <ul className={styles.can}>
                <li>
                  <span className={styles.iconBubble} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-15-6.7L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 15 6.7L21 16" /><path d="M21 21v-5h-5" /></svg>
                  </span>
                  <div>
                    <strong>Renew your current plan</strong>
                    <span>Where your plan allows early renewal</span>
                  </div>
                </li>
                <li>
                  <span className={styles.iconBubble} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>
                  </span>
                  <div>
                    <strong>Add extra data</strong>
                    <span>Data extras compatible with your plan</span>
                  </div>
                </li>
                <li>
                  <span className={styles.iconBubble} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
                  </span>
                  <div>
                    <strong>Pay an outstanding bill</strong>
                    <span>A separate option in My Zoiko — not a top-up</span>
                  </div>
                </li>
              </ul>
              <p className={styles.sideNote}>
                You&rsquo;ll only see options your line can actually use, with
                the price, VAT and how long it lasts.
              </p>
            </div>

            <div className={styles.card}>
              <h2 className={styles.sideTitle}>Want a different plan?</h2>
              <p className={styles.sideText}>
                Topping up doesn&rsquo;t change your plan. To choose a new one,
                see all SIM-only plans.
              </p>
              <Link href="/plans" className={styles.textLink}>
                Explore all SIM-only plans ›
              </Link>
            </div>
          </aside>
        </div>

        <section className={styles.faq} aria-labelledby="topup-faq">
          <h2 id="topup-faq" className={styles.faqTitle}>Top-up questions</h2>
          <div className={styles.faqBox}>
            {FAQS.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
        </div>
      </main>

      {modalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mHead}>
              <h3 className={styles.mTitle}>Select Recharge Plan</h3>
              <button className={styles.mClose} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.simStrip}>
              <div className={styles.stripInfo}>
                <span>
                  <span className={styles.stripLbl}>Phone: </span>
                  {sim?.phone_number}
                </span>
                <span>
                  <span className={styles.stripLbl}>SIM ID: </span>
                  {sim?.sim_card_id_masked}
                </span>
              </div>
              <button
                className={styles.stripChange}
                onClick={() => {
                  closeModal();
                  handleChangeNumber();
                }}
              >
                Change
              </button>
            </div>

            {modalStep === STEP_PLANS && (
              <>
                {plansLoading && <div className={styles.mid}>Loading plans…</div>}
                {plansError && (
                  <div className={styles.mid}>
                    <p className={styles.error}>{plansError}</p>
                  </div>
                )}
                {!plansLoading && !plansError && (
                  <div className={styles.planGrid}>
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className={styles.planCard}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        <div className={styles.planBadge}>
                          <span className={styles.planGb}>
                            {plan.attributes?.data || plan.name}
                          </span>
                          {plan.attributes?.data && (
                            <span className={styles.planUnit}>DATA</span>
                          )}
                        </div>
                        <span className={styles.planName}>{plan.name}</span>
                        <span className={styles.planPrice}>
                          {plan.formatted_price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {modalStep === STEP_PAYMENT && selectedPlan && (
              <div className={styles.payWrap}>
                <div className={styles.selPlan}>
                  <p className={styles.selTag}>Selected Plan</p>
                  <p className={styles.selName}>{selectedPlan.name}</p>
                  <p className={styles.selPrice}>
                    {selectedPlan.formatted_price}
                  </p>
                </div>

                <button
                  className={styles.backBtn}
                  onClick={() => setModalStep(STEP_PLANS)}
                >
                  ← Back to plans
                </button>

                {/* <div className={styles.payOpts}>
                  <div className={styles.payOpt}>
                    <span className={styles.payTitle}>Google Pay</span>
                  </div>
                  <div className={styles.payOpt}>
                    <span className={styles.payTitle}>Credit/Debit Cards</span>
                    <span className={styles.paySub}>
                      Visa, Mastercard, Amex, Discover
                    </span>
                  </div>
                </div> */}

                {payError && <p className={styles.error}>{payError}</p>}

                <button
                  className={styles.payNow}
                  onClick={handlePayNow}
                  disabled={paying}
                >
                  {paying ? "Redirecting to payment…" : "Pay Now"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}