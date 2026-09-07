"use client";

import { useState, useCallback, useEffect } from "react";
import {
  validatePhone,
  getProducts,
  createRechargeOrder,
  RechargeAPIError,
} from "./api";
import styles from "./recharge.module.css";

// ─── Phone Input ─────────────────────────────────────────────────────────

function PhoneStep({ onValidated }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleValidate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await validatePhone(phone);
      if (data.success) {
        onValidated({
          phone: data.sim.phone_number,
          simCardIdMasked: data.sim.sim_card_id_masked,
          simIccidMasked: data.sim.sim_iccid_masked,
          simStatus: data.sim.sim_status,
          rechargeable: data.sim.rechargeable,
          simSerial: data.sim_serial,
          simIccid: data.sim_iccid,
        });
      } else {
        setError(data.message || "Validation failed.");
      }
    } catch (err) {
      setError(err instanceof RechargeAPIError ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleValidate} className={styles.phoneForm}>
      <label className={styles.label}>
        Phone Number (MSISDN) <span className={styles.req}>*</span>
      </label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+447421118918"
        className={styles.phoneInput}
        required
        disabled={loading}
      />
      {loading && <p className={styles.validating}>Validating...</p>}
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.validateBtn} disabled={loading || phone.length < 7}>
        {loading ? "Checking..." : "Validate"}
      </button>
    </form>
  );
}

// ─── SIM Details ─────────────────────────────────────────────────────────

function SimDetails({ sim, onRecharge }) {
  return (
    <div className={styles.simCard}>
      <p className={styles.validated}>✓ Phone number validated successfully!</p>
      <div className={styles.simTable}>
        <div className={styles.simTableHead}>SIM Details</div>
        <div className={styles.simRow}>
          <span className={styles.simLabel}>Phone Number:</span>
          <span className={styles.simVal}>{sim.phone}</span>
        </div>
        <div className={styles.simRow}>
          <span className={styles.simLabel}>SIM Card ID:</span>
          <span className={styles.simVal}>{sim.simCardIdMasked}</span>
        </div>
      </div>
      {sim.rechargeable ? (
        <button onClick={onRecharge} className={styles.rechargeBtn}>Recharge Now</button>
      ) : (
        <p className={styles.notRechargeable}>
          This SIM is <strong>{sim.simStatus}</strong> — recharge is only available for suspended SIMs.
        </p>
      )}
    </div>
  );
}

// ─── Plan Modal ──────────────────────────────────────────────────────────

function PlanModal({ sim, onClose }) {
  const [step, setStep] = useState("loading");
  const [products, setProducts] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState("");
  const [orderRef, setOrderRef] = useState("");

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const d = await getProducts("recharge");
        if (!c) { setProducts(d.products || []); setStep("plans"); }
      } catch (e) {
        if (!c) { setError(e.message || "Failed to load."); setStep("error"); }
      }
    })();
    return () => { c = true; };
  }, []);

  const handlePay = async () => {
    if (!selectedPlan) return;
    setStep("processing");
    setError("");
    try {
      const data = await createRechargeOrder({
        msisdn: sim.phone,
        productId: selectedPlan.id,
        simSerial: sim.simSerial,
        simIccid: sim.simIccid,
      });
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setOrderRef(data.order_ref);
        setStep("success");
      }
    } catch (e) {
      setError(e.message || "Payment failed.");
      setStep("error");
    }
  };

  const gb = (p) => {
    const g = p.attributes?.data_gb;
    if (!g) return null;
    return g >= 999 ? "UNLIMITED" : `${g}GB`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.mHead}>
          <h2 className={styles.mTitle}>Select Recharge Plan</h2>
          <button onClick={onClose} className={styles.mClose}>✕</button>
        </div>

        {/* SIM strip */}
        <div className={styles.simStrip}>
          <div className={styles.stripInfo}>
            <span><b className={styles.stripLbl}>Phone:</b> {sim.phone}</span>
            <span><b className={styles.stripLbl}>SIM ID:</b> {sim.simCardIdMasked}</span>
          </div>
          <button onClick={onClose} className={styles.stripChange}>Change</button>
        </div>

        {/* Loading */}
        {step === "loading" && (
          <div className={styles.mid}><div className={styles.spin} /><p>Loading products...</p></div>
        )}

        {/* Plans grid */}
        {step === "plans" && (
          <div className={styles.planGrid}>
            {products.map((p) => (
              <button key={p.id} className={styles.planCard} onClick={() => { setSelectedPlan(p); setStep("payment"); }}>
                {gb(p) && (
                  <div className={styles.planBadge}>
                    <span className={styles.planGb}>{gb(p)}</span>
                    {gb(p) !== "UNLIMITED" && <span className={styles.planUnit}>DATA</span>}
                  </div>
                )}
                <span className={styles.planName}>{p.name}</span>
                <span className={styles.planPrice}>{p.formatted_price}</span>
              </button>
            ))}
          </div>
        )}

        {/* Payment */}
        {step === "payment" && selectedPlan && (
          <div className={styles.payWrap}>
            <div className={styles.selPlan}>
              <p className={styles.selTag}>Selected Plan</p>
              <p className={styles.selName}>{selectedPlan.name}</p>
              <p className={styles.selPrice}>{selectedPlan.formatted_price}</p>
            </div>
            <button className={styles.backBtn} onClick={() => setStep("plans")}>← Back to plans</button>

            <div className={styles.payOpts}>
              <div className={styles.payOpt}>
                <span className={styles.payTitle}>Cash on delivery</span>
                <span className={styles.paySub}>Pay with cash upon delivery.</span>
              </div>
              <div className={styles.payOpt}>
                <div className={styles.payIcons}>
                  <svg viewBox="0 0 24 24" width="22" height="22" className={styles.gpay}>
                    <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
                  </svg>
                  <span className={styles.payTitle}>Google Pay</span>
                </div>
              </div>
              <div className={styles.payOpt}>
                <div className={styles.payIcons}>
                  <span className={styles.cb} style={{background:"#1a237e"}}>AMEX</span>
                  <span className={styles.cb} style={{background:"#ef6c00"}}>DISC</span>
                  <span className={styles.cb} style={{background:"#1565c0"}}>VISA</span>
                  <span className={styles.cb} style={{background:"#c62828"}}>MC</span>
                </div>
                <span className={styles.payTitle}>Credit/Debit Cards</span>
              </div>
            </div>

            <button className={styles.payNow} onClick={handlePay}>Pay Now</button>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className={styles.mid}>
            <div className={styles.spinLg} />
            <h3>Processing Payment...</h3>
            <p>Please wait while we process your recharge.</p>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className={styles.mid}>
            <div className={styles.okIcon}>✓</div>
            <h3>Success!</h3>
            <p>Payment successful! Your recharge has been processed.</p>
            {orderRef && <p><strong>Order Number:</strong> #{orderRef}</p>}
            <p><strong>Phone:</strong> {sim.phone}</p>
            <button onClick={onClose} className={styles.doneBtn}>Close</button>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className={styles.mid}>
            <div className={styles.failIcon}>✕</div>
            <h3>Payment Failed</h3>
            <p>{error || "Something went wrong."}</p>
            <button onClick={() => setStep(selectedPlan ? "payment" : "plans")} className={styles.retryBtn}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function RechargePage() {
  const [sim, setSim] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleValidated = useCallback((d) => setSim(d), []);

  return (
    <div className={styles.page}>
      {/* Hero Banner — full-width image */}
      <section className={styles.hero}>
        <img
          src="/images/recharge-hero.png"
          alt="Stay connected without interruptions! Recharge your SIM today."
          className={styles.heroBanner}
        />
      </section>

      {/* Form */}
      <div className={styles.formWrap}>
        {!sim ? (
          <PhoneStep onValidated={handleValidated} />
        ) : (
          <>
            <SimDetails sim={sim} onRecharge={() => setShowModal(true)} />
            <div className={styles.resetRow}>
              <button onClick={() => { setSim(null); setShowModal(false); }} className={styles.resetBtn}>
                Use a different number
              </button>
            </div>
          </>
        )}
      </div>

      {showModal && sim && <PlanModal sim={sim} onClose={() => setShowModal(false)} />}
    </div>
  );
}
