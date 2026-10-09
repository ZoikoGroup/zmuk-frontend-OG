"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getOrderStatus } from "../api";
import styles from "../recharge.module.css";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

async function confirmBySession(orderRef) {
  const res = await fetch(`${API_BASE}/api/recharge/confirm-session/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_ref: orderRef }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Confirm failed (${res.status})`);
  return data;
}

export default function RechargeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.container}>
            <div className={styles.simCard}>
              <div className={styles.centered}>
                <div className={styles.spinnerLarge} />
                <h3>Processing Payment...</h3>
                <p>Please wait while we process your recharge.</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <RechargeSuccessContent />
    </Suspense>
  );
}

function RechargeSuccessContent() {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get("ref");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderRef) {
      setError("No order reference found.");
      setLoading(false);
      return;
    }

    async function processSuccess() {
      try {
        // Step 1: Try to confirm directly via Stripe session (no CLI needed)
        const confirmData = await confirmBySession(orderRef);
        if (confirmData.success) {
          setOrder(confirmData.order);
          setLoading(false);
          return;
        }
      } catch (confirmErr) {
        console.warn("Session confirm failed, falling back to poll:", confirmErr.message);
      }

      // Step 2: Fallback — poll order status (works when webhook fires)
      let attempts = 0;
      const maxAttempts = 10;

      async function pollOrder() {
        try {
          const data = await getOrderStatus(orderRef);
          if (data.success) {
            setOrder(data.order);
            if (
              data.order.status === "processing" ||
              data.order.status === "pending_payment" ||
              data.order.status === "pending"
            ) {
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(pollOrder, 2000);
                return;
              }
            }
          } else {
            setError(data.message || "Order not found.");
          }
        } catch (err) {
          setError(err.message || "Failed to load order.");
        }
        setLoading(false);
      }

      pollOrder();
    }

    processSuccess();
  }, [orderRef]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.simCard}>
            <div className={styles.centered}>
              <div className={styles.spinnerLarge} />
              <h3>Processing Payment...</h3>
              <p>Please wait while we confirm your recharge.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.simCard}>
            <div className={styles.centered}>
              <div className={styles.errorIcon}>✕</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <a href="/recharge" className={styles.retryBtn}>
                Back to Recharge
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess =
    order?.status === "completed" ||
    order?.status === "processing" ||
    order?.status === "pending";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.simCard}>
          <div className={styles.centered}>
            {isSuccess ? (
              <>
                <div className={styles.successIcon}>✓</div>
                <h3>Payment Successful!</h3>
                <p>Your recharge has been processed.</p>
                <p><strong>Order Number:</strong> #{order.order_ref}</p>
                <p><strong>Phone:</strong> {order.msisdn}</p>
                <p><strong>Amount:</strong> {order.amount}</p>
                {order.product_name && (
                  <p><strong>Plan:</strong> {order.product_name}</p>
                )}
                {order.reactivation_status === "success" && (
                  <p style={{ color: "#2e7d32", marginTop: "0.75rem" }}>
                    ✓ SIM reactivated successfully
                  </p>
                )}
                {(order.reactivation_status === "pending" || order.status === "pending") && (
                  <p style={{ color: "#f57c00", marginTop: "0.75rem" }}>
                    ⏳ Payment received — SIM reactivation in progress...
                  </p>
                )}
                {order.reactivation_status === "failed" && (
                  <p style={{ color: "#e53935", marginTop: "0.75rem" }}>
                    ⚠ SIM reactivation failed — our team has been notified and will retry shortly.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className={styles.errorIcon}>✕</div>
                <h3>Payment Failed</h3>
                <p>Your payment was not completed. No charge has been made.</p>
              </>
            )}
            <a
              href="/recharge"
              className={styles.closeModalBtn}
              style={{ display: "inline-block", textDecoration: "none", marginTop: "1.25rem" }}
            >
              Back to Recharge
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}