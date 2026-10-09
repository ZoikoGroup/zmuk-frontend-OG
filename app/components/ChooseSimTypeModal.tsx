"use client";

import { useState } from "react";

// Shared "Choose SIM Type" modal (eSIM / pSIM), used by every plan page.
// The chosen type is passed back via onConfirm and stored on the cart item
// (metadata.simType) by addPlanToCart.
export default function ChooseSimTypeModal({
  planName,
  onConfirm,
  onClose,
}: {
  planName: string;
  onConfirm: (simType: "esim" | "psim") => void;
  onClose: () => void;
}) {
  const [simType, setSimType] = useState<"esim" | "psim">("psim");
  const [adding, setAdding] = useState(false);

  const confirm = () => {
    setAdding(true);
    onConfirm(simType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose SIM Type</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{planName}</p>

        {/* eSIM */}
        <label
          className={`mb-3 block cursor-pointer rounded-md border p-4 ${
            simType === "esim" ? "border-[#e6007e] ring-1 ring-[#e6007e]" : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <span className="flex items-center gap-2">
            <input type="radio" name="simType" checked={simType === "esim"} onChange={() => setSimType("esim")} />
            <span className="font-semibold text-gray-900 dark:text-white">eSIM</span>
          </span>
          <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
            Is your device eSIM-compatible? After your order we&rsquo;ll email you instructions to download and
            activate your Zoiko Mobile eSIM.
          </span>
        </label>

        {/* pSIM */}
        <label
          className={`mb-4 block cursor-pointer rounded-md border p-4 ${
            simType === "psim" ? "border-[#e6007e] ring-1 ring-[#e6007e]" : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <span className="flex items-center gap-2">
            <input type="radio" name="simType" checked={simType === "psim"} onChange={() => setSimType("psim")} />
            <span className="font-semibold text-gray-900 dark:text-white">pSIM (Physical)</span>
          </span>
          <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
            Physical SIM — shipped to you with your order.
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600">
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={adding}
            className="rounded bg-[#1d6fd8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#175bb5] disabled:opacity-60"
          >
            {adding ? "Adding…" : "Add to order"}
          </button>
        </div>
      </div>
    </div>
  );
}