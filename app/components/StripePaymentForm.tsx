"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { forwardRef, useImperativeHandle, useState } from "react";

export type StripePaymentFormRef = {
  /**
   * Validates the PaymentElement, then confirms the payment against the
   * PaymentIntent that `<Elements clientSecret={...}>` was already mounted
   * with (created up front by the checkout page). Returns success/error so
   * the caller can decide whether to proceed with persisting the order.
   */
  submitPayment: () => Promise<{ success: boolean; error?: string }>;
};

interface StripePaymentFormProps {
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

const StripePaymentForm = forwardRef<StripePaymentFormRef, StripePaymentFormProps>(
  ({ onPaymentSuccess, onPaymentError }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    useImperativeHandle(ref, () => ({
      async submitPayment() {
        if (!stripe || !elements) {
          const error = "Stripe is not loaded yet";
          setErrorMessage(error);
          onPaymentError?.(error);
          return { success: false, error };
        }

        setLoading(true);
        setErrorMessage("");

        try {
          // 1. Trigger form validation and collect the payment details.
          const { error: submitError } = await elements.submit();
          if (submitError) {
            const msg = submitError.message || "Please check your card details";
            setErrorMessage(msg);
            onPaymentError?.(msg);
            return { success: false, error: msg };
          }

          // 2. Confirm the payment against the PaymentIntent that `elements`
          //    was already initialised with (created by the checkout page's
          //    call to /api/create-payment-intent before this form rendered).
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/payment-success`,
            },
            redirect: "if_required",
          });

          if (error) {
            const errorMsg = error.message || "Payment failed";
            setErrorMessage(errorMsg);
            onPaymentError?.(errorMsg);
            return { success: false, error: errorMsg };
          }

          onPaymentSuccess?.();
          return { success: true };
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "An unexpected error occurred";
          setErrorMessage(errorMsg);
          onPaymentError?.(errorMsg);
          return { success: false, error: errorMsg };
        } finally {
          setLoading(false);
        }
      },
    }));

    return (
      <div className={loading ? "pointer-events-none opacity-60" : undefined}>
        <PaymentElement options={{ layout: "tabs" }} />
        {errorMessage && (
          <div
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

StripePaymentForm.displayName = "StripePaymentForm";
export default StripePaymentForm;