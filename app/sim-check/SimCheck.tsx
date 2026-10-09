"use client";

import { useState } from "react";
import { fetchSubscriber, fetchEsim } from "../../lib/useTransatel";

export default function SimCheck() {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const check = async () => {
    setLoading(true);
    setResult(null);
    const sub = await fetchSubscriber(serial.trim());
    if (sub.error) setResult(`Error: ${sub.error}`);
    else if (!sub.found) {
      // not active as a subscriber yet — check the eSIM profile status instead
      const esim = await fetchEsim(serial.trim());
      setResult(esim.found ? `eSIM status: ${JSON.stringify(esim.data)}` : "SIM not registered yet.");
    } else {
      setResult(`Active subscriber: ${JSON.stringify(sub.data)}`);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">Check your SIM</h1>
      <div className="flex gap-2">
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Enter ICCID (SIM serial)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={check}
          disabled={loading || !serial.trim()}
          className="rounded-md bg-[#e6007e] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </div>
      {result && <pre className="mt-4 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-200">{result}</pre>}
    </div>
  );
}