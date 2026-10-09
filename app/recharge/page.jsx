"use client";

import { useState } from "react";
import Image from "next/image";
import {
  validatePhone,
  getProducts,
  createRechargeOrder,
  RechargeAPIError,
} from "./api";
import styles from "./recharge.module.css";
import heroImg from "./images/recharge-hero.png";

// Steps within the modal
const STEP_PLANS = "plans";
const STEP_PAYMENT = "payment";

export default function RechargePage() {
  // ── Phone + SIM state ───────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState("");
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
    if (!phone.trim()) return;

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

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Image
          src={heroImg}
          alt="Recharge your SIM"
          className={styles.heroBanner}
          priority
        />
      </div>

      <div className={styles.formWrap}>
        <div className={styles.phoneForm}>
          <form onSubmit={handleValidate}>
            <label className={styles.label} htmlFor="msisdn">
              Phone Number (MSISDN) <span className={styles.req}>*</span>
            </label>
            <input
              id="msisdn"
              type="tel"
              className={styles.phoneInput}
              placeholder="Enter your phone number"
              value={phone}
              disabled={validating || !!sim}
              onChange={(e) => setPhone(e.target.value)}
            />

            {validating && (
              <p className={styles.validating}>Validating phone number…</p>
            )}
            {validateError && <p className={styles.error}>{validateError}</p>}
            {sim && (
              <p className={styles.validated}>
                ✓ Phone number validated successfully!
              </p>
            )}

            {!sim && (
              <button
                type="submit"
                className={styles.validateBtn}
                disabled={validating || !phone.trim()}
              >
                {validating ? "Validating…" : "Validate Number"}
              </button>
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
      </div>

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