// Single source of truth for the Contact Us page.
// The form is generated from ENQUIRY_TYPES: picking an enquiry type changes the
// extra fields, hints and the placeholder shown. Add a type here and it appears
// in the "What do you need help with?" cards AND in the form dropdown.

/** Subjects accepted by the backend (apps/contact/models.py SUBJECT_CHOICES). */
export type BackendSubject =
  | "General Enquiry"
  | "Billing"
  | "Technical Support"
  | "Roaming & International"
  | "Complaints"
  | "Other";

export type ExtraField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "select";
  options?: string[];
  pattern?: RegExp;
  patternMessage?: string;
};

export type EnquiryType = {
  id: string;
  label: string;
  desc: string;
  icon: "sim" | "billing" | "network" | "roaming" | "orders" | "business" | "complaint" | "access";
  subject: BackendSubject;
  messagePlaceholder: string;
  extraFields: ExtraField[];
  /** shown on the "What do you need help with?" grid */
  card: boolean;
};

export const ENQUIRY_TYPES: EnquiryType[] = [
  {
    id: "sim-activation",
    label: "SIM & activation",
    desc: "Activate your SIM, eSIM, or get help with SIM issues.",
    icon: "sim",
    subject: "Technical Support",
    messagePlaceholder: "Please give us the details of your enquiry...",
    card: true,
    extraFields: [
      { name: "simType", label: "SIM type", type: "select", options: ["Physical SIM", "eSIM", "Not sure"] },
      {
        name: "iccid",
        label: "SIM number (ICCID)",
        placeholder: "19–20 digits printed on your SIM card",
        pattern: /^\d{19,20}$/,
        patternMessage: "SIM numbers are 19 or 20 digits.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing & payments",
    desc: "Bills, payments, top-ups and charges.",
    icon: "billing",
    subject: "Billing",
    messagePlaceholder: "Tell us which charge or payment you're asking about...",
    card: true,
    extraFields: [
      { name: "orderRef", label: "Order or invoice reference", placeholder: "e.g. ZM-123456" },
    ],
  },
  {
    id: "network",
    label: "Network & coverage",
    desc: "Coverage, network status and service issues.",
    icon: "network",
    subject: "Technical Support",
    messagePlaceholder: "Where and when does the problem happen?",
    card: true,
    extraFields: [
      { name: "postcode", label: "Postcode where it happens", placeholder: "e.g. W1W 5PF", required: true },
      { name: "device", label: "Phone model", placeholder: "e.g. iPhone 15" },
    ],
  },
  {
    id: "roaming",
    label: "Roaming & calls",
    desc: "Using your plan in the UK and abroad.",
    icon: "roaming",
    subject: "Roaming & International",
    messagePlaceholder: "Where are you travelling and what do you need to know?",
    card: true,
    extraFields: [
      { name: "destination", label: "Destination country", placeholder: "e.g. Spain", required: true },
    ],
  },
  {
    id: "orders",
    label: "Orders & switching",
    desc: "Track an order, switch to Zoiko or keep your number.",
    icon: "orders",
    subject: "General Enquiry",
    messagePlaceholder: "Tell us about your order or switch...",
    card: true,
    extraFields: [
      { name: "orderRef", label: "Order reference", placeholder: "e.g. ZM-123456" },
    ],
  },
  {
    id: "business",
    label: "Business support",
    desc: "Help for business accounts, plans and multi-line setup.",
    icon: "business",
    subject: "General Enquiry",
    messagePlaceholder: "Tell us about your business and what you need...",
    card: true,
    extraFields: [
      { name: "company", label: "Company name", placeholder: "Your company", required: true },
      { name: "lines", label: "Number of lines", placeholder: "e.g. 10" },
    ],
  },
  {
    id: "complaint",
    label: "Make a complaint",
    desc: "Not happy with something? Let us know and we'll work to put it right.",
    icon: "complaint",
    subject: "Complaints",
    messagePlaceholder: "Please describe what went wrong and what you'd like us to do...",
    card: false,
    extraFields: [
      { name: "orderRef", label: "Order or account reference", placeholder: "If you have one" },
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility support",
    desc: "Support options for customers with disabilities or additional needs.",
    icon: "access",
    subject: "General Enquiry",
    messagePlaceholder: "Tell us how we can make things easier for you...",
    card: false,
    extraFields: [
      {
        name: "contactPref",
        label: "Preferred way to be contacted",
        type: "select",
        options: ["Email", "Phone", "Text relay"],
      },
    ],
  },
  {
    id: "other",
    label: "Something else",
    desc: "Anything not listed above.",
    icon: "orders",
    subject: "Other",
    messagePlaceholder: "Please give us the details of your enquiry...",
    card: false,
    extraFields: [],
  },
];

export const DEFAULT_ENQUIRY_ID = ENQUIRY_TYPES[0].id;

// UK support phone line. Used to work out "Currently open / closed" live.
export const PHONE_HOURS = {
  display: "020 7164 6399",
  tel: "02071646399",
  text: "Mon–Fri 8am–8pm, Sat 9am–5pm (UK time)",
  // 0 = Sunday … 6 = Saturday; [openHour, closeHour) in UK local time
  schedule: { 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [9, 17] } as Record<number, [number, number]>,
};

export function isPhoneOpenNow(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  const slot = PHONE_HOURS.schedule[dayIndex];
  return !!slot && hour >= slot[0] && hour < slot[1];
}

export const HELPFUL_LINKS = [
  { title: "Activate your SIM", desc: "Get set up and start using your plan.", href: "/activate-your-sim" },
  { title: "Manage your account", desc: "Check usage, bills, plans and settings.", href: "/dashboard" },
  { title: "Top up", desc: "Add credit or a data bundle.", href: "/top-up" },
  { title: "Roaming guidance", desc: "Use your plan abroad and check costs.", href: "/roaming-and-coverage" },
  { title: "Track an order", desc: "See the latest on your device or SIM order.", href: "/dashboard" },
];

export const MESSAGE_MAX = 2000;
