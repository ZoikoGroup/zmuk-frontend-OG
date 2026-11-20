// Site-wide promotions whose coupon code is pre-filled at checkout while live.
// The backend remains the source of truth: it validates the code and its dates
// on apply-coupon and create-intent. These dates only control the auto-fill.

export interface Promotion {
  code: string;
  label: string;
  /** Short line shown under the coupon box while the code is filled but not applied. */
  hint: string;
  /** ISO timestamp, inclusive. */
  startsAt: string;
  /** ISO timestamp, exclusive. */
  endsAt: string;
}

export const PROMOTIONS: Promotion[] = [
  {
    code: "BLACKFRIDAY",
    label: "Black Friday",
    hint: "Black Friday code added. Click Apply to save 30%.",
    // UK is on GMT (= UTC) in November: 20 Nov 00:00 → 30 Nov 23:59:59.
    startsAt: "2026-11-20T00:00:00Z",
    endsAt: "2026-12-01T00:00:00Z",
  },
];

export function getActivePromotion(now: Date = new Date()): Promotion | null {
  return (
    PROMOTIONS.find(
      (p) => now >= new Date(p.startsAt) && now < new Date(p.endsAt)
    ) ?? null
  );
}
