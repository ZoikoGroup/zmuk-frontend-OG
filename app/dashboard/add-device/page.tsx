"use client";

import { useState } from "react";
import { validateImeiOrEid } from "../../utils/validators";

// ---------- Types ----------
interface DeviceOption {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

interface ApiResult {
  success?: boolean;
  compatible?: boolean;
  esimCompatible?: boolean;
  lteCompatible?: boolean;
  blacklisted?: boolean;
  manufacturer?: string;
  device?: string;
  deviceCategory?: string;
}

// ---------- Constants ----------
const DEVICES: DeviceOption[] = [
  { id: "smartphone", title: "Smartphone", desc: "For calls, texts, data, and apps on the road", icon: "📱" },
  { id: "tablet", title: "Tablet", desc: "Perfect for navigation and entertainment", icon: "💻" },
  { id: "hotspot", title: "Mobile Hotspot", desc: "Share internet with multiple devices", icon: "📶" },
  { id: "iot", title: "IoT Device", desc: "Fleet tracking and monitoring devices", icon: "🔗" },
];

// ---------- Component ----------
export default function AddDevicePage() {
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [imei, setImei] = useState("");
  const [validationMsg, setValidationMsg] = useState("");
  const [apiResult, setApiResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  // ---------- Helpers ----------
  const handleNext = (): void => {
    if (step === 1 && !selectedDevice) { alert("Please select a device type."); return; }
    if (step === 2 && (!apiResult || !apiResult.compatible)) { alert("Please check device compatibility before continuing."); return; }
    setStep((s) => s + 1);
  };

  const handleBack = (): void => setStep((s) => s - 1);

  const openChat = (): void => {
    const tawk = window as Window & { Tawk_API?: { maximize: () => void } };
    if (tawk.Tawk_API) tawk.Tawk_API.maximize();
    else alert("Chat is loading... please try again in a moment!");
  };

  const validateIMEI = (): boolean => {
    const check = validateImeiOrEid(imei);
    if (!check.isValid) {
      setValidationMsg(`❌ ${check.error || "Please enter a valid 15-digit IMEI or 32-digit EID number."}`);
      return false;
    }
    setValidationMsg(`✅ ${check.type || "IMEI"} validated successfully!`);
    return true;
  };

  const validateAndCheckDevice = async (): Promise<void> => {
    if (!validateIMEI()) return;

    setLoading(true);
    setApiResult(null);
    setValidationMsg("Checking device compatibility...");

    try {
      const res = await fetch("https://goliteapi.golitemobile.com/api/device_compatibility_checker/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Secret-Key": "jSje2gyRQpi4SjYZ",
        },
        body: JSON.stringify({ action: "esim_checker", imei }),
      });

      const data: ApiResult = await res.json();
      console.log("API Response:", data);
      setApiResult(data);

      if (data.success && data.compatible) setValidationMsg("✅ Device is compatible!");
      else if (data.success && !data.compatible) setValidationMsg("❌ Device is NOT compatible.");
      else setValidationMsg("❌ Unable to verify device.");
    } catch (err) {
      console.error(err);
      setValidationMsg("❌ Error checking device. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmActivate = (): void => {
    alert("✅ Device successfully added!");
    setStep(1);
    setSelectedDevice("");
    setImei("");
    setValidationMsg("");
    setApiResult(null);
  };

  // ---------- Progress Bar ----------
  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
      <div
        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${(step / 3) * 100}%` }}
      />
    </div>
  );

  // ---------- Step 1 ----------
  const renderStep1 = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <p className="text-gray-400 text-sm mb-1">Step 1 of 3</p>
      <h4 className="font-bold text-xl mb-2">Device Selection</h4>
      <p className="text-gray-400 text-sm mb-5">Choose the type of device you want to add to your plan.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {DEVICES.map((device) => (
          <div
            key={device.id}
            onClick={() => setSelectedDevice(device.id)}
            className={`border rounded-lg p-4 text-center cursor-pointer transition-all ${
              selectedDevice === device.id
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "border-gray-200 bg-white dark:bg-gray-700 hover:border-green-300"
            }`}
          >
            <div className="text-4xl mb-2">{device.icon}</div>
            <h6 className="font-semibold mb-1 text-sm">{device.title}</h6>
            <p className="text-gray-400 text-xs mb-0">{device.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          onClick={handleNext}
        >
          Continue to Device Info →
        </button>
      </div>
    </div>
  );

  // ---------- Step 2 ----------
  const renderStep2 = () => {
    const isValidIMEI = /^\d{15,16}$/.test(imei) || /^\d{32}$/.test(imei);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <p className="text-gray-400 text-sm mb-1">Step 2 of 3</p>
        <h4 className="font-bold text-xl mb-2">Device Info</h4>
        <p className="text-gray-400 text-sm mb-5">
          Provide your device&apos;s unique identifier to check compatibility with our network.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Device IMEI or EID Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter 15/16-digit IMEI or 32-digit EID"
            />
            <button
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={validateAndCheckDevice}
              disabled={!isValidIMEI || loading}
            >
              {loading ? "Checking..." : "Check Compatibility"}
            </button>
          </div>
          {validationMsg && (
            <p className={`text-sm mt-2 ${validationMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
              {validationMsg}
            </p>
          )}
        </div>

        {/* Device Info Result */}
        {apiResult && apiResult.compatible && (
          <div className="border border-green-500 rounded-lg p-4 mb-4 text-green-700 text-sm">
            <p className="mb-1"><strong>Manufacturer:</strong> {apiResult.manufacturer}</p>
            <p className="mb-1"><strong>Model:</strong> {apiResult.device}</p>
            <p className="mb-1"><strong>eSIM Compatible:</strong> {apiResult.esimCompatible ? "Yes" : "No"}</p>
            <p className="mb-1"><strong>LTE Compatible:</strong> {apiResult.lteCompatible ? "Yes" : "No"}</p>
            <p className="mb-1"><strong>Blacklisted:</strong> {apiResult.blacklisted ? "Yes" : "No"}</p>
            <p className="mb-0"><strong>Category:</strong> {apiResult.deviceCategory}</p>
          </div>
        )}

        <p className="text-gray-400 text-sm">
          Find your IMEI by dialing <strong>*#06#</strong> or checking Settings → About.
        </p>

        <div className="flex justify-between mt-5">
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            onClick={handleBack}
          >
            ← Back
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleNext}
            disabled={!apiResult || !apiResult.compatible}
          >
            Continue to Review →
          </button>
        </div>
      </div>
    );
  };

  // ---------- Step 3 ----------
  const renderStep3 = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <p className="text-gray-400 text-sm mb-1">Step 3 of 3</p>
      <h4 className="font-bold text-xl mb-4">Review &amp; Confirm</h4>

      <div className="bg-gray-50 dark:bg-gray-700 border rounded-lg p-4 mb-4 text-sm">
        <p className="mb-1"><strong>Device Type:</strong> {selectedDevice}</p>
        <p className="mb-0"><strong>IMEI/EID:</strong> {imei}</p>
      </div>

      <p className="text-gray-400 text-sm mb-5">Please confirm your device details before activation.</p>

      <div className="flex justify-between">
        <button
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          onClick={handleBack}
        >
          ← Back
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          onClick={handleConfirmActivate}
        >
          Confirm &amp; Activate
        </button>
      </div>
    </div>
  );

  // ---------- Render ----------
  return (
    <div className="flex flex-col min-h-screen">
      <main className="grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Steps */}
            <div className="lg:col-span-2">
              <ProgressBar />
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </div>

            {/* Help Sidebar */}
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                <h5 className="font-semibold mb-3">Finding Your IMEI/EID</h5>

                <p className="text-sm font-semibold mb-1">For Smartphones &amp; Tablets:</p>
                <ul className="text-gray-400 text-sm list-disc pl-4 mb-4 space-y-1">
                  <li>Dial *#06# to display IMEI</li>
                  <li>Go to Settings → About → IMEI</li>
                  <li>Check device box or SIM tray</li>
                </ul>

                <p className="text-sm font-semibold mb-1">For eSIM devices:</p>
                <ul className="text-gray-400 text-sm list-disc pl-4 mb-4 space-y-1">
                  <li>Look for EID in Settings → Cellular</li>
                  <li>EID is 32 digits long</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <h6 className="font-semibold text-gray-800 mb-2">Need Assistance?</h6>
                  <p className="text-gray-400 text-sm mb-3">
                    Our support team is available 24/7. Chat with us for help with device compatibility or activation.
                  </p>
              <a href="https://driverxchatbot-722985113446.europe-west1.run.app/">    <button
                    className="w-full px-4 py-2 bg-yellow-400 text-gray-800 font-semibold rounded-md hover:bg-yellow-500 transition-colors"
                    onClick={openChat}
                  >
                    Chat with Support
                  </button></a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}