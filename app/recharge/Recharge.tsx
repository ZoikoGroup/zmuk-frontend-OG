"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

// Base URL from env (NEXT_PUBLIC_API_URL). Paths built inline.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Module = {
  key: string;
  name: string;
  category: string;
  shortcode: string;
  enabled: boolean;
  status: "Enabled" | "Disabled";
};

type Phase = "idle" | "starting" | "redirecting" | "error";

const PRESET_AMOUNTS = ["5", "10", "15", "20", "30"];

function Recharge() {
  const [modules, setModules] = useState<Module[]>([]);
  const [module, setModule] = useState<string>("recharge");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("10");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  // Load the enabled modules (Recharge / Top Up / Pending Bill) from the backend.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/recharge/modules/`);
        const data: Module[] = await res.json();
        if (!alive) return;
        const enabled = data.filter((m) => m.enabled);
        setModules(enabled);
        if (enabled.length && !enabled.some((m) => m.key === module)) {
          setModule(enabled[0].key);
        }
      } catch {
        /* modules are optional for the form to work; ignore load errors */
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const digits = phone.replace(/\D/g, "");
  const amountNum = Number(amount);
  const isValid = digits.length >= 7 && amountNum >= 1 && amountNum <= 100;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValid) return;

    setPhase("starting");
    try {
      const res = await fetch(`${API_BASE}/api/recharge/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msisdn: phone.trim(),
          module,
          amount: amountNum.toFixed(2),
          success_url: `${window.location.origin}/recharge/success`,
          cancel_url: `${window.location.origin}/recharge`,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.checkout_url) {
        setPhase("redirecting");
        // Hand off to Stripe's hosted, SCA-compliant checkout page.
        window.location.href = data.checkout_url as string;
        return;
      }

      setPhase("error");
      setError((data && data.detail) || `Could not start payment (status ${res.status}).`);
    } catch {
      setPhase("error");
      setError("Could not reach the server. Please try again.");
    }
  };

  const busy = phase === "starting" || phase === "redirecting";

  return (
    <main className="relative bg-white font-sans dark:bg-gray-900">
      <Link
        href=""
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg bg-[#e6007e] px-2 py-4 text-xs font-semibold text-white shadow-lg [writing-mode:vertical-rl] hover:bg-[#c4007a]"
      >
        Get in touch
      </Link>

      <section className="w-full">
        <Image
          src="/images/topup/Rectangle 41673.png"
          alt="Stay connected without interruptions — recharge your SIM with Zoiko Mobile"
          width={1920}
          height={500}
          priority
          sizes="100vw"
          className="h-auto w-full"
        />
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 md:px-8 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
          {/* Module selector — only enabled modules from the backend */}
          {modules.length > 0 && (
            <div className="mb-6">
              <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">Service</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {modules.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setModule(m.key)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      module === m.key
                        ? "border-[#e6007e] bg-[#e6007e] text-white"
                        : "border-gray-300 text-gray-600 hover:border-[#e6007e] dark:border-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label htmlFor="msisdn" className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
            Phone Number (MSISDN) <span className="text-[#e6007e]">*</span>
          </label>
          <input
            id="msisdn"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            disabled={busy}
            className="mt-2 w-full rounded-md border border-[#e6007e]/60 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#e6007e] focus:outline-none focus:ring-1 focus:ring-[#e6007e] disabled:opacity-60 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />

          {/* Amount */}
          <label htmlFor="amount" className="mt-6 block text-sm font-semibold text-gray-800 dark:text-gray-100">
            Amount (£) <span className="text-[#e6007e]">*</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                disabled={busy}
                className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                  amount === a
                    ? "border-[#e6007e] bg-[#e6007e] text-white"
                    : "border-gray-300 text-gray-600 hover:border-[#e6007e] dark:border-gray-600 dark:text-gray-300"
                }`}
              >
                £{a}
              </button>
            ))}
          </div>
          <input
            id="amount"
            type="number"
            min={1}
            max={100}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className="mt-2 w-full rounded-md border border-[#e6007e]/60 px-4 py-3 text-sm text-gray-700 focus:border-[#e6007e] focus:outline-none focus:ring-1 focus:ring-[#e6007e] disabled:opacity-60 dark:bg-gray-800 dark:text-gray-100"
          />

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || busy}
            className={`mt-6 w-full rounded-md px-6 py-3 text-sm font-semibold transition-colors sm:w-auto ${
              isValid && !busy
                ? "bg-[#e6007e] text-white hover:bg-[#c4007a]"
                : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
            }`}
          >
            {phase === "starting"
              ? "Starting secure checkout…"
              : phase === "redirecting"
              ? "Redirecting to payment…"
              : "Recharge Now"}
          </button>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Payments are processed securely by Stripe. You&rsquo;ll be redirected to a secure checkout page.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Recharge;
export { Recharge };