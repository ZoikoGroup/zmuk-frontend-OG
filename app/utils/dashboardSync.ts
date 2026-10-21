export interface StoredBoosterItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  billingType: "one-off" | "monthly" | "per-day";
  category: "booster" | "call-text" | "travel";
  status: "Active" | "Pending" | "Recurring" | "Expired" | "Cancelled";
  addedAt: string;
  renewsOrEndsText: string;
  gb?: number;
  lineId?: string;
}

export function formatUkPhone(raw?: string | null): string {
  if (!raw) return "";
  const cleaned = String(raw).replace(/\D/g, "");
  if (!cleaned) return "";
  let std = cleaned;
  if (std.startsWith("44") && std.length >= 11) {
    std = "0" + std.slice(2);
  } else if (!std.startsWith("0")) {
    std = "0" + std;
  }
  if (std.length >= 11) {
    return `${std.slice(0, 5)} ${std.slice(5, 11)}`;
  }
  return raw;
}

export function getFallbackUserLine(userData?: any) {
  if (typeof window === "undefined") {
    return null;
  }

  let user = userData;
  if (!user) {
    try {
      const uStr =
        localStorage.getItem("zoiko_user") ||
        localStorage.getItem("driverx_user");
      if (uStr) user = JSON.parse(uStr);
    } catch {}
  }

  const rawPhone =
    user?.phone_number ||
    user?.phone ||
    user?.mobile ||
    (typeof window !== "undefined" ? localStorage.getItem("zoiko_user_phone") : null) ||
    "";

  // If user has no phone number, return null — do NOT inject fake phone numbers!
  if (!rawPhone || !rawPhone.trim()) {
    return null;
  }

  const savedPlan =
    (typeof window !== "undefined" && localStorage.getItem("zoiko_active_plan")) || "Zoiko SIM Plan";

  // Parse GB from plan name (e.g. "Zoiko Max 30GB" -> 30)
  let planGb = 10;
  const gbMatch = savedPlan.match(/(\d+)\s*GB/i);
  if (gbMatch) {
    planGb = Number(gbMatch[1]);
  } else if (savedPlan.toLowerCase().includes("unlimited")) {
    planGb = 100;
  }

  return {
    id: "primary-line-1",
    number: formatUkPhone(rawPhone),
    planName: savedPlan,
    planGb,
    status: "Active",
    simType: "SIM card",
  };
}

export function getStoredBoosters(lineId?: string): StoredBoosterItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("zoiko_line_addons");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (lineId && parsed[lineId]) {
      return parsed[lineId].filter(
        (item: StoredBoosterItem) =>
          item.category === "booster" && item.status !== "Cancelled"
      );
    }
    // Return all boosters across all lines if no lineId
    const all: StoredBoosterItem[] = [];
    Object.values(parsed).forEach((list: any) => {
      if (Array.isArray(list)) {
        list.forEach((item) => {
          if (item.category === "booster" && item.status !== "Cancelled") {
            all.push(item);
          }
        });
      }
    });
    return all;
  } catch {
    return [];
  }
}

export function getBoosterSummary(lineId?: string) {
  if (typeof window === "undefined") {
    return { count: 0, totalGb: 0, totalCost: 0 };
  }
  const boosters = getStoredBoosters(lineId);
  const count = boosters.length;

  // Calculate total GB added
  let totalGb = 0;
  boosters.forEach((b) => {
    if (b.gb) {
      totalGb += b.gb;
    } else {
      const match = b.title.match(/(\d+)\s*GB/i);
      if (match) totalGb += Number(match[1]);
    }
  });

  // Also check explicit zoiko_data_boosters_gb override if available
  const storedGb = Number(localStorage.getItem("zoiko_data_boosters_gb") || "0");
  if (storedGb > totalGb) {
    totalGb = storedGb;
  }

  const totalCost = boosters.reduce((acc, b) => acc + (b.price || 0), 0);
  const storedExtra = Number(
    localStorage.getItem("zoiko_extra_boosters_charge") ||
      localStorage.getItem("zoiko_extra_charges") ||
      "0"
  );

  return {
    count,
    totalGb: Number(totalGb.toFixed(1)),
    totalCost: Math.max(totalCost, storedExtra),
  };
}

export function recordBoosterPurchase(params: {
  addedGb: number;
  cost: number;
  lineId?: string;
  lineNumber?: string;
  boosterName?: string;
}) {
  if (typeof window === "undefined") return;

  const { addedGb, cost, lineId = "primary-line-1", lineNumber, boosterName } = params;

  const title = boosterName || `${addedGb} GB Data Booster`;
  const newItem: StoredBoosterItem = {
    id: `booster-${Date.now()}`,
    title,
    subtitle: `+${addedGb} GB high-speed UK & EU data`,
    price: cost,
    billingType: "one-off",
    category: "booster",
    status: "Active",
    addedAt: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    renewsOrEndsText: "Valid until end of current billing cycle",
    gb: addedGb,
    lineId,
  };

  // 1. Update zoiko_line_addons map
  try {
    const rawMap = localStorage.getItem("zoiko_line_addons");
    const map = rawMap ? JSON.parse(rawMap) : {};
    const lineList = map[lineId] || [];
    map[lineId] = [newItem, ...lineList];
    localStorage.setItem("zoiko_line_addons", JSON.stringify(map));
  } catch (e) {
    console.error("Failed to update zoiko_line_addons:", e);
  }

  // 2. Update zoiko_data_boosters_gb
  try {
    const prevGb = Number(localStorage.getItem("zoiko_data_boosters_gb") || "0");
    const newGb = Number((prevGb + addedGb).toFixed(1));
    localStorage.setItem("zoiko_data_boosters_gb", String(newGb));
  } catch {}

  // 3. Update zoiko_data_remaining
  try {
    const prevRemaining = Number(
      localStorage.getItem("zoiko_data_remaining") || "0"
    );
    if (prevRemaining > 0) {
      localStorage.setItem(
        "zoiko_data_remaining",
        String(Number((prevRemaining + addedGb).toFixed(1)))
      );
    }
  } catch {}

  // 4. Update billing extra spend / unbilled charges
  try {
    const prevExtra = Number(localStorage.getItem("zoiko_extra_charges") || "0");
    localStorage.setItem("zoiko_extra_charges", String(Number((prevExtra + cost).toFixed(2))));

    const prevBoostersCharge = Number(
      localStorage.getItem("zoiko_extra_boosters_charge") || "0"
    );
    localStorage.setItem(
      "zoiko_extra_boosters_charge",
      String(Number((prevBoostersCharge + cost).toFixed(2)))
    );
  } catch {}

  // 5. Fire synchronization events across dashboard
  window.dispatchEvent(new Event("zoiko-booster-updated"));
  window.dispatchEvent(new Event("zoiko-auth"));
}
