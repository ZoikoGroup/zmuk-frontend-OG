"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Phone,
  MessageSquare,
  Mail,
  Headphones,
  CheckCircle2,
  FileText,
  Sliders,
  Globe,
  Receipt,
  PlusCircle,
  Video,
  PlayCircle,
  HelpCircle,
  Radio,
  Eye,
  KeyRound,
  Users,
  Heart,
  ChevronRight,
  X,
  ExternalLink,
  Calendar,
  AlertCircle,
  Info,
  Send,
  Check,
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const SUPPORT_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE}/api/support/`;

interface Ticket {
  id: string;
  reference: string;
  subject: string;
  openedDate: string;
  updatedDate: string;
  type: "Question" | "Formal complaint" | "Technical" | "Billing";
  status: "Awaiting your reply" | "Under investigation" | "Resolved" | "Closed";
  isOpen: boolean;
  message?: string;
  replies?: { from: "user" | "support"; message: string; time: string }[];
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "1",
    reference: "SR-DEMO-45821",
    subject: "Question about roaming charges",
    openedDate: "Opened 14 Oct 2026",
    updatedDate: "Updated 14 Oct, 10:01",
    type: "Question",
    status: "Awaiting your reply",
    isOpen: true,
    message: "I am traveling to France next week and wanted to verify if my monthly 30GB allowance works at no extra charge or if I need to purchase a roaming booster.",
    replies: [
      {
        from: "support",
        message: "Hello! In the EU / EEA, your plan includes Roam Like at Home up to our fair usage limit of 15GB. If you expect to exceed this, you can activate our EU Roaming Data Booster anytime from your dashboard.",
        time: "14 Oct 2026, 10:01",
      },
    ],
  },
  {
    id: "2",
    reference: "CP-DEMO-43011",
    subject: "Booster charge on my bill",
    openedDate: "Opened 3 Oct 2026",
    updatedDate: "Updated 9 Oct, 11:20",
    type: "Formal complaint",
    status: "Under investigation",
    isOpen: true,
    message: "I was billed £6.00 for an international bolt-on that I did not authorise or activate.",
    replies: [
      {
        from: "support",
        message: "Thank you for letting us know. A Senior Case Officer is reviewing your billing logs and purchase timestamps. We aim to conclude formal investigations within 7 business days.",
        time: "9 Oct 2026, 11:20",
      },
    ],
  },
  {
    id: "3",
    reference: "SR-DEMO-41902",
    subject: "eSIM QR code not scanning",
    openedDate: "Opened 18 Sep 2026",
    updatedDate: "Updated 19 Sep, 14:10",
    type: "Technical",
    status: "Resolved",
    isOpen: false,
    message: "Camera cannot recognize the QR activation code sent to my email.",
    replies: [
      {
        from: "support",
        message: "We have reissued a refreshed high-contrast eSIM profile QR code and provided manual SM-DP+ server address and activation code. The eSIM is now active on your device.",
        time: "19 Sep 2026, 14:10",
      },
    ],
  },
  {
    id: "4",
    reference: "SR-DEMO-39401",
    subject: "Direct debit date change",
    openedDate: "Opened 2 Aug 2026",
    updatedDate: "Updated 3 Aug, 09:30",
    type: "Billing",
    status: "Closed",
    isOpen: false,
    message: "Please move my monthly direct debit deduction date from the 5th to the 28th.",
    replies: [
      {
        from: "support",
        message: "Your billing collection date has been successfully adjusted to the 28th of every month.",
        time: "3 Aug 2026, 09:30",
      },
    ],
  },
];

interface HelpArticle {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  content: string[];
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "lost-sim",
    title: "If your phone or SIM is lost or stolen",
    subtitle: "Protect your number first, then order a replacement.",
    category: "Emergency & Security",
    content: [
      "1. Suspend your SIM immediately to prevent unauthorised calls, texts, and mobile data usage.",
      "2. Keep your account safe: Change your Zoiko account password and revoke active sessions in Security & Settings.",
      "3. In an emergency or if you are in immediate danger, call 999 or 112 directly. This online tool does not replace emergency response.",
      "4. Order a replacement SIM or instant eSIM directly from your SIM management dashboard. We will transfer your existing phone number and remaining allowance seamlessly.",
    ],
  },
  {
    id: "roaming",
    title: "Roaming charges explained",
    subtitle: "What’s included abroad, what costs extra, and how to check before you go.",
    category: "Roaming & Travel",
    content: [
      "• EU & EEA Roaming: You can use your call and text allowances just like in the UK. A fair usage roaming data policy applies (up to 15GB).",
      "• Outside the EU: Roaming charges vary by destination zone. Check the Roaming section of your dashboard before you travel.",
      "• Roaming Add-ons: Save significantly by buying a destination booster prior to departure.",
      "• Bill Protection: Your account includes a statutory £45 roaming spend cap that automatically halts data once reached unless you choose to increase it.",
    ],
  },
  {
    id: "bill",
    title: "Understanding your bill",
    subtitle: "What each line on your bill means, and when it’s issued and collected.",
    category: "Bills & Payments",
    content: [
      "• Plan Fee: Charged one month in advance for your chosen monthly recurring tariff.",
      "• Usage Outside Allowance: Premium rate numbers, international calls, or data beyond your bundle are billed in arrears.",
      "• Payment Dates: Your invoice is generated 7 days before your scheduled Direct Debit or card collection date.",
      "• Downloading VAT Receipts: Full PDF statements with itemised breakdowns are available in the Bills & Payments section.",
    ],
  },
  {
    id: "data",
    title: "Mobile data not working",
    subtitle: "Simple checks to get mobile data working again.",
    category: "Technical & Device",
    content: [
      "1. Toggle Airplane Mode: Switch Airplane mode ON for 10 seconds, then turn it OFF to reconnect to the nearest cell mast.",
      "2. Restart Device: Power down your smartphone completely and restart it.",
      "3. Verify APN Settings: APN Name should be 'zoiko.internet' with APN Type set to 'default,supl'.",
      "4. Check Balance: Log into your dashboard to confirm you have remaining high-speed data or active booster.",
    ],
  },
  {
    id: "esim",
    title: "Set up your eSIM",
    subtitle: "Activate your digital SIM card within 2 minutes.",
    category: "SIM & eSIM",
    content: [
      "• Ensure your phone is connected to a stable Wi-Fi network.",
      "• Navigate to Settings > Mobile Data / Cellular > Add eSIM.",
      "• Scan the QR code sent to your registered Zoiko email address or displayed in your SIM dashboard.",
      "• Label your new eSIM and set it as your primary line for voice and data.",
    ],
  },
  {
    id: "change-plan",
    title: "Change your plan",
    subtitle: "Upgrade or downgrade your monthly tariff anytime.",
    category: "Plans & Switching",
    content: [
      "• You can change your plan at any time without paying penalties or admin fees.",
      "• Upgrades take effect immediately so you can enjoy increased data allowances right away.",
      "• Downgrades will take effect at the start of your next billing cycle.",
    ],
  },
  {
    id: "getting-started",
    title: "Getting started with Zoiko",
    subtitle: "Web guide · reviewed Sep 2026",
    category: "User Guides",
    content: [
      "Welcome to Zoiko Mobile! Here's everything you need to know about setting up your voicemail, porting your existing mobile number with a PAC code, downloading the web app, and managing family members.",
    ],
  },
  {
    id: "complaints-process",
    title: "How complaints work",
    subtitle: "Our process, and free independent review",
    category: "Complaints",
    content: [
      "• Step 1: Raise your complaint directly via the 'Make a complaint' form. We acknowledge all complaints within 24 hours.",
      "• Step 2: An independent case handler investigates the dispute and issues a formal written outcome within 14 calendar days.",
      "• Step 3: If your complaint remains unresolved after 8 weeks or reaches deadlock, you are entitled to free independent Alternative Dispute Resolution (ADR) via Ombudsman Services: Communications.",
    ],
  },
];

const CARD =
  "bg-white rounded-[20px] shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-[#E6E8EE] p-5 flex flex-col min-w-0";

export default function SupportPage() {
  const router = useRouter();

  // Layout state
  const [activeTab, setActiveTab] = useState("support");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");

  // User state
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Account holder");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [planName, setPlanName] = useState("");
  const [numbersCount, setNumbersCount] = useState(0);
  const [checkedAt, setCheckedAt] = useState("Just now");
  const [refreshing, setRefreshing] = useState(false);

  // Search & Help Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [ticketFilter, setTicketFilter] = useState<"open" | "all">("open");
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");

  // Modals
  const [modal, setModal] = useState<
    null | "new_request" | "complaint" | "lost_sim" | "network_issue" | "extra_support" | "braille" | "auth_person"
  >(null);

  // Form states
  const [newRequestSubject, setNewRequestSubject] = useState("");
  const [newRequestType, setNewRequestType] = useState<"Question" | "Technical" | "Billing">("Question");
  const [newRequestMessage, setNewRequestMessage] = useState("");
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDetails, setComplaintDetails] = useState("");
  const [networkPostcode, setNetworkPostcode] = useState("");
  const [networkIssueDesc, setNetworkIssueDesc] = useState("");
  const [extraSupportNeeds, setExtraSupportNeeds] = useState("");
  const [formatPreference, setFormatPreference] = useState("Large print (18pt)");
  const [authPersonName, setAuthPersonName] = useState("");
  const [authPersonRelation, setAuthPersonRelation] = useState("");
  const [authPersonPhone, setAuthPersonPhone] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load user data & saved tickets from localStorage
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const storedToken =
        localStorage.getItem("zoiko_token") || localStorage.getItem("driverx_token") || "";
      setToken(storedToken);

      let user: any = {};
      try {
        user = JSON.parse(localStorage.getItem("zoiko_user") || "{}");
      } catch {}

      const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
        user?.name ||
        user?.username ||
        (user?.email ? user.email.split("@")[0] : "Account holder");
      setUserName(fullName);
      setUserEmail(user?.email || "");
      setUserPhone(user?.phone_number || user?.phone || "");

      // Load tickets
      const savedTickets = localStorage.getItem("zoiko_support_tickets");
      if (savedTickets) {
        try {
          const parsed = JSON.parse(savedTickets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTickets(parsed);
          }
        } catch {}
      }

      // Fetch user's active plan from backend if available
      if (storedToken) {
        fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
          headers: { Authorization: `Token ${storedToken}` },
        })
          .then((r) => (r.ok ? r.json() : []))
          .then((orders: any) => {
            if (Array.isArray(orders) && orders.length > 0) {
              const active = orders[0];
              const pTitle = active?.plan?.title || active?.plan_name;
              if (pTitle) setPlanName(pTitle);
              setNumbersCount(orders.length);
            }
          })
          .catch(() => {});
      }

      const now = new Date();
      setCheckedAt(
        `${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} BST, ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      );
    } finally {
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500);
        showToast("Help content and ticket statuses refreshed.");
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Persist tickets
  const persistTickets = (next: Ticket[]) => {
    setTickets(next);
    try {
      localStorage.setItem("zoiko_support_tickets", JSON.stringify(next));
    } catch {}
  };

  // Submit new request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestSubject.trim() || !newRequestMessage.trim()) {
      showToast("Please provide both a subject and details.");
      return;
    }

    const newTicket: Ticket = {
      id: Date.now().toString(),
      reference: `SR-REQ-${Math.floor(10000 + Math.random() * 90000)}`,
      subject: newRequestSubject.trim(),
      openedDate: `Opened ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      updatedDate: "Updated Just now",
      type: newRequestType,
      status: "Awaiting your reply",
      isOpen: true,
      message: newRequestMessage.trim(),
      replies: [],
    };

    const nextTickets = [newTicket, ...tickets];
    persistTickets(nextTickets);

    // Optional API POST
    if (token) {
      fetch(`${SUPPORT_URL}tickets/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: newRequestSubject,
          category: newRequestType.toLowerCase(),
          message: newRequestMessage,
        }),
      }).catch(() => {});
    }

    setNewRequestSubject("");
    setNewRequestMessage("");
    setModal(null);
    showToast(`Request ${newTicket.reference} created. We reply within 24 hours.`);
  };

  // Submit formal complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDetails.trim()) {
      showToast("Please provide subject and complaint details.");
      return;
    }

    const newComplaint: Ticket = {
      id: Date.now().toString(),
      reference: `CP-COMP-${Math.floor(10000 + Math.random() * 90000)}`,
      subject: complaintSubject.trim(),
      openedDate: `Opened ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      updatedDate: "Updated Just now",
      type: "Formal complaint",
      status: "Under investigation",
      isOpen: true,
      message: complaintDetails.trim(),
      replies: [
        {
          from: "support",
          message: "Formal complaint logged with our Customer Resolution Team. Your reference number is above. A Senior Case Manager will reach out within 2 business days.",
          time: "Just now",
        },
      ],
    };

    const nextTickets = [newComplaint, ...tickets];
    persistTickets(nextTickets);

    setComplaintSubject("");
    setComplaintDetails("");
    setModal(null);
    showToast(`Formal complaint ${newComplaint.reference} logged.`);
  };

  // Reply to an active ticket
  const handleSendTicketReply = () => {
    if (!viewingTicket || !ticketReplyText.trim()) return;

    const replyMsg = ticketReplyText.trim();
    const updated = tickets.map((t) => {
      if (t.id === viewingTicket.id) {
        const newReplies = [
          ...(t.replies || []),
          {
            from: "user" as const,
            message: replyMsg,
            time: `Today, ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
          },
        ];
        return {
          ...t,
          updatedDate: "Updated Just now",
          replies: newReplies,
        };
      }
      return t;
    });

    persistTickets(updated);
    setViewingTicket({
      ...viewingTicket,
      updatedDate: "Updated Just now",
      replies: [
        ...(viewingTicket.replies || []),
        {
          from: "user",
          message: replyMsg,
          time: `Today, ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
        },
      ],
    });
    setTicketReplyText("");
    showToast("Reply sent to our customer care team.");
  };

  // Filtered tickets
  const openCount = useMemo(() => tickets.filter((t) => t.isOpen).length, [tickets]);
  const allCount = tickets.length;
  const displayedTickets = useMemo(() => {
    if (ticketFilter === "open") {
      return tickets.filter((t) => t.isOpen);
    }
    return tickets;
  }, [tickets, ticketFilter]);

  // Search filtered articles
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HELP_ARTICLES.slice(0, 4);
    return HELP_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-3 sm:p-5">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 bg-[#0D1935] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-medium border border-white/10 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#E6007E] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={numbersCount}
            planName={planName}
            renewDate="28 Oct"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Nav */}
          <DashboardTopNav
            userName={userName}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Help & support"
            customSubtitle="Find answers, contact us, and track your requests and complaints."
          />

          {/* Freshness Status Strip */}
          <div className="flex items-center gap-2 text-xs text-[#54617E]">
            <Clock className="w-3.5 h-3.5 text-[#54617E]" />
            <span>Help content checked {checkedAt}</span>
            <button
              type="button"
              onClick={() => loadData(true)}
              title="Refresh help content"
              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* URGENT BANNER: Lost phone or SIM */}
          {/* ========================================================================= */}
          <div className="w-full p-4 sm:p-4.5 bg-[#FFF5F5] rounded-[20px] border border-[#FECDCA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#E6007E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#0D1935] leading-tight">
                  Lost your phone or SIM, or think someone’s in your account?
                </h3>
                <p className="text-xs text-[#54617E] mt-0.5 leading-relaxed">
                  Get urgent help now. You don’t need to be signed in. In an emergency, call 999 or 112 — this doesn’t replace emergency services.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setModal("lost_sim")}
                className="h-9 px-3.5 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-[10px] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Lost or stolen SIM</span>
              </button>
              <Link
                href="/dashboard/security"
                className="h-9 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#E6007E] border border-[#FBCFE8] text-xs font-semibold rounded-[10px] transition cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Account security</span>
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 1: Search for help (Left) & Contact us (Right) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Col: Search for help (~65%) */}
            <div className={`lg:col-span-8 ${CARD}`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Search for help</h3>
                  <p className="text-xs text-[#54617E]">Answers from our help articles</p>
                </div>
              </div>

              {/* Search input + button */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#54617E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Try "roaming", "change my plan" or "check bill"'
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E6E8EE] bg-white text-sm text-[#0D1935] placeholder:text-slate-400 focus:outline-none focus:border-[#E6007E] transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (filteredArticles.length > 0) {
                      setSelectedArticle(filteredArticles[0]);
                    } else {
                      showToast("No matching articles found. Try another search.");
                    }
                  }}
                  className="h-11 px-4 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer shrink-0"
                >
                  Search
                </button>
              </div>

              {/* Popular quick-chips */}
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                <span className="text-xs text-[#54617E] mr-1">Popular:</span>
                {[
                  { label: "Set up eSIM", id: "esim" },
                  { label: "Change plan", id: "change-plan" },
                  { label: "Roaming charges", id: "roaming" },
                  { label: "Check bill", id: "bill" },
                  { label: "Lost phone", id: "lost-sim" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      const found = HELP_ARTICLES.find((a) => a.id === chip.id);
                      if (found) setSelectedArticle(found);
                    }}
                    className="h-7 px-3 bg-white hover:bg-slate-50 border border-[#E6E8EE] rounded-full text-xs font-semibold text-[#334155] transition cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Common answers heading */}
              <div className="pt-2 border-t border-[#F2F4F7]">
                <div className="text-xs font-semibold text-[#54617E] mb-2">Common answers</div>
                <div className="divide-y divide-[#F2F4F7]">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left py-2.5 px-2 rounded-xl hover:bg-slate-50 transition flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F4F5F8] group-hover:bg-[#FFF5F8] text-[#E6007E] flex items-center justify-center shrink-0 transition">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-[#0D1935] truncate group-hover:text-[#E6007E] transition">
                            {article.title}
                          </div>
                          <div className="text-xs text-[#54617E] truncate">
                            {article.subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Contact us (~35%) */}
            <div className={`lg:col-span-4 ${CARD}`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Contact us</h3>
                  <p className="text-xs text-[#54617E]">Only channels that are working</p>
                </div>
              </div>

              {/* Channel 1: Message us (Active / Highlighted) */}
              <div
                onClick={() => setModal("new_request")}
                className="p-3.5 rounded-2xl bg-[#FFF5F8] border border-[#FBCFE8] hover:border-[#E6007E] cursor-pointer transition flex items-center justify-between gap-3 mb-2.5 group shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#FBCFE8] text-[#E6007E] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0D1935] group-hover:text-[#E6007E] transition">
                      Message us
                    </div>
                    <div className="text-xs text-[#54617E] leading-tight">
                      Any time · we reply in your requests and by email
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
              </div>

              {/* Channel 2: Live chat (Not available yet) */}
              <div className="p-3 rounded-2xl border border-[#E6E8EE] bg-white flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E8EE] text-[#54617E] flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0D1935]">Live chat</div>
                    <div className="text-xs text-[#54617E]">Not available yet</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#F4F5F8] text-[#54617E] text-[11px] font-semibold rounded-full shrink-0">
                  Not available
                </span>
              </div>

              {/* Channel 3: Phone (Not yet) */}
              <div className="p-3 rounded-2xl border border-[#E6E8EE] bg-white flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E8EE] text-[#54617E] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#0D1935]">Phone</div>
                    <div className="text-xs text-[#54617E] leading-tight">
                      Number published once it’s confirmed
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#F4F5F8] text-[#54617E] text-[11px] font-semibold rounded-full shrink-0">
                  Not yet
                </span>
              </div>

              {/* Security info note */}
              <div className="mt-auto pt-2 flex items-start gap-1.5 text-xs text-[#54617E]">
                <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0 mt-0.5" />
                <p className="leading-tight">
                  We don’t offer WhatsApp support. We’ll never ask for your password or codes.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 2: 4-Column Grid: Do it yourself | User guides | Video guides | Help topics */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Col 1: Do it yourself */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0D1935]">Do it yourself</h3>
                  <p className="text-xs text-[#54617E]">Opens the right part of your account</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {[
                  {
                    title: "Activate or manage your SIM",
                    sub: "SIM, eSIM and replacements",
                    href: "/dashboard/sim",
                    icon: Radio,
                  },
                  {
                    title: "Change your plan",
                    sub: "See the price before you confirm",
                    href: "/dashboard/plans",
                    icon: Sliders,
                  },
                  {
                    title: "Check roaming",
                    sub: "What's included where you're going",
                    href: "/dashboard/roaming",
                    icon: Globe,
                  },
                  {
                    title: "Check your bill",
                    sub: "Bills, payments and bill limit",
                    href: "/dashboard/bills",
                    icon: Receipt,
                  },
                  {
                    title: "Add data",
                    sub: "Boosters and add-ons",
                    href: "/dashboard/addons",
                    icon: PlusCircle,
                  },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="py-2.5 flex items-center justify-between gap-2 group hover:text-[#E6007E] transition"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#54617E] truncate">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 2: User guides */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0D1935]">User guides</h3>
                  <p className="text-xs text-[#54617E]">Current guides only</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {[
                  {
                    title: "Getting started with Zoiko",
                    sub: "Web guide · reviewed Sep 2026",
                    id: "getting-started",
                  },
                  {
                    title: "Bills and payments guide",
                    sub: "Web guide · reviewed Oct 2026",
                    id: "bill",
                  },
                  {
                    title: "Roaming and travel guide",
                    sub: "Web guide · reviewed Oct 2026",
                    id: "roaming",
                  },
                  {
                    title: "Phone set-up guide",
                    sub: "Web guide · reviewed Sep 2026",
                    id: "data",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const found = HELP_ARTICLES.find((a) => a.id === item.id);
                      if (found) setSelectedArticle(found);
                    }}
                    className="w-full text-left py-2.5 flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#54617E] truncate">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                ))}
              </div>

              {/* Bottom accessibility note */}
              <div className="pt-2 mt-auto border-t border-[#F2F4F7] flex items-start gap-1.5 text-xs text-[#54617E]">
                <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0 mt-0.5" />
                <button
                  type="button"
                  onClick={() => setModal("braille")}
                  className="text-left text-xs text-[#54617E] hover:text-[#0D1935] underline decoration-slate-300 cursor-pointer"
                >
                  Need large print, Braille or audio? Ask us — it’s free.
                </button>
              </div>
            </div>

            {/* Col 3: Video guides */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0D1935]">Video guides</h3>
                  <p className="text-xs text-[#54617E]">With captions and transcripts</p>
                </div>
              </div>

              {/* Notice Box */}
              <div className="p-3 bg-[#F8F9FC] rounded-xl border border-[#E6E8EE] mb-3 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#E6007E] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#0D1935]">No videos yet</div>
                  <div className="text-[11px] text-[#54617E] leading-relaxed">
                    We’ll add videos once they have captions and transcripts. The written guides cover the same topics.
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {[
                  { title: "Set up your eSIM", sub: "Written guide", id: "esim" },
                  { title: "Roaming charges explained", sub: "Written guide", id: "roaming" },
                  { title: "Mobile data not working", sub: "Written guide", id: "data" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const found = HELP_ARTICLES.find((a) => a.id === item.id);
                      if (found) setSelectedArticle(found);
                    }}
                    className="w-full text-left py-2.5 flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-[#54617E]">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Col 4: Help topics */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0D1935]">Help topics</h3>
                  <p className="text-xs text-[#54617E]">Browse by subject</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7] flex-1">
                {[
                  { title: "Signing in and security", count: "1 article", id: "lost-sim" },
                  { title: "Plans and switching", count: "2 articles", id: "change-plan" },
                  { title: "SIM and eSIM", count: "2 articles", id: "esim" },
                  { title: "Roaming and travel", count: "1 article", id: "roaming" },
                  { title: "Bills and payments", count: "2 articles", id: "bill" },
                  { title: "Phones and settings", count: "2 articles", id: "data" },
                  { title: "Network and signal", count: "1 article", id: "data" },
                  { title: "Fixing problems", count: "1 article", id: "data" },
                  { title: "Privacy and your data", count: "1 article", id: "complaints-process" },
                ].map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const found = HELP_ARTICLES.find((a) => a.id === topic.id);
                      if (found) setSelectedArticle(found);
                    }}
                    className="w-full text-left py-1.5 flex items-center justify-between gap-2 group cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition truncate">
                        {topic.title}
                      </div>
                      <div className="text-[10px] text-[#54617E]">{topic.count}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-[#0D1935] transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 3: Your requests and complaints (Full Width) */}
          {/* ========================================================================= */}
          <div className={CARD}>
            {/* Header + New request action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Your requests and complaints</h3>
                  <p className="text-xs text-[#54617E]">Only cases on your account</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModal("new_request")}
                className="h-9 px-3.5 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-[10px] transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New request</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTicketFilter("open")}
                className={`h-8 px-3 rounded-full text-xs font-semibold transition cursor-pointer ${
                  ticketFilter === "open"
                    ? "bg-[#0D1935] text-white"
                    : "bg-white text-[#334155] border border-[#E6E8EE] hover:bg-slate-50"
                }`}
              >
                Open · {openCount}
              </button>
              <button
                type="button"
                onClick={() => setTicketFilter("all")}
                className={`h-8 px-3 rounded-full text-xs font-semibold transition cursor-pointer ${
                  ticketFilter === "all"
                    ? "bg-[#0D1935] text-white"
                    : "bg-white text-[#334155] border border-[#E6E8EE] hover:bg-slate-50"
                }`}
              >
                All · {allCount}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[620px] text-xs">
                <thead>
                  <tr className="border-b border-[#F2F4F7] text-left text-[#54617E] font-semibold">
                    <th className="pb-2.5 font-semibold">Reference</th>
                    <th className="pb-2.5 font-semibold">Subject</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F7]">
                  {displayedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No requests found in this view.
                      </td>
                    </tr>
                  ) : (
                    displayedTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pr-3">
                          <div className="font-bold text-[#0D1935]">{t.reference}</div>
                          <div className="text-[11px] text-[#54617E] font-medium">{t.openedDate}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="text-[#0D1935] font-medium">{t.subject}</div>
                          <div className="text-[11px] text-[#54617E]">{t.updatedDate}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              t.type === "Formal complaint"
                                ? "bg-[#FFF5F8] text-[#E6007E]"
                                : t.type === "Technical"
                                ? "bg-purple-50 text-purple-700"
                                : t.type === "Billing"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-[#F4F5F8] text-[#334155]"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              t.status === "Awaiting your reply"
                                ? "bg-amber-50 text-amber-800"
                                : t.status === "Under investigation"
                                ? "bg-blue-50 text-blue-700"
                                : t.status === "Resolved"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            type="button"
                            onClick={() => setViewingTicket(t)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#E6007E] hover:text-[#D80070] cursor-pointer"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 4: 2-Column Grid: Service status & Complaints */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Col 1: Service status */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Service status</h3>
                  <p className="text-xs text-[#54617E]">Confirmed incidents only</p>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 bg-[#EFF8FF] rounded-2xl border border-[#B2DDFF] flex flex-col gap-1 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white text-[#175CD3] flex items-center justify-center shadow-xs mb-1">
                  <CheckCircle2 className="w-5 h-5 text-[#175CD3]" />
                </div>
                <div className="text-sm font-bold text-[#0D1935]">No known incidents</div>
                <div className="text-xs text-[#54617E]">
                  None in our records · last checked 10:05 BST. This isn’t a coverage guarantee.
                </div>
              </div>

              {/* Maintenance & Report */}
              <div className="divide-y divide-[#F2F4F7]">
                <div className="py-2.5 flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#E6007E] shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-[#0D1935]">Planned maintenance</div>
                    <div className="text-xs text-[#54617E]">None scheduled</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModal("network_issue")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-[#E6007E] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                        Report a network issue
                      </div>
                      <div className="text-xs text-[#54617E]">Tell us what’s happening where you are</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              </div>
            </div>

            {/* Col 2: Complaints */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Complaints</h3>
                  <p className="text-xs text-[#54617E]">You can complain at any time</p>
                </div>
              </div>

              {/* Make Complaint button */}
              <button
                type="button"
                onClick={() => setModal("complaint")}
                className="w-full h-10 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 mb-3 shadow-xs"
              >
                <span>Make a complaint</span>
              </button>

              {/* How complaints work */}
              <button
                type="button"
                onClick={() => {
                  const art = HELP_ARTICLES.find((a) => a.id === "complaints-process");
                  if (art) setSelectedArticle(art);
                }}
                className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer border-t border-[#F2F4F7]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-[#E6007E] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                      How complaints work
                    </div>
                    <div className="text-xs text-[#54617E]">Our process, and free independent review</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
              </button>

              {/* Prefer a call back? */}
              <div className="mt-auto pt-3 border-t border-[#F2F4F7]">
                <div className="text-xs font-semibold text-[#0D1935] mb-0.5">Prefer a call back?</div>
                <div className="flex items-center gap-1.5 text-xs text-[#54617E]">
                  <Info className="w-3.5 h-3.5 text-[#54617E] shrink-0" />
                  <span>Call backs aren’t available yet. Message us instead.</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ROW 5: 2-Column Grid: Extra support & Community forum */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Col 1: Extra support */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Extra support</h3>
                  <p className="text-xs text-[#54617E]">Tell us what helps you</p>
                </div>
              </div>

              <div className="divide-y divide-[#F2F4F7]">
                <button
                  type="button"
                  onClick={() => setModal("extra_support")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Heart className="w-4 h-4 text-[#E6007E] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                        Tell us about support needs
                      </div>
                      <div className="text-xs text-[#54617E]">You don’t have to tell us a diagnosis</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setModal("braille")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-[#E6007E] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                        Large print, Braille or audio
                      </div>
                      <div className="text-xs text-[#54617E]">Free for bills and letters</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                </button>

                <Link
                  href="/forgot-password"
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Lock className="w-4 h-4 text-[#E6007E] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                        Can’t sign in?
                      </div>
                      <div className="text-xs text-[#54617E]">Get help without signing in</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                </Link>

                <button
                  type="button"
                  onClick={() => setModal("auth_person")}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Users className="w-4 h-4 text-[#E6007E] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-[#0D1935] group-hover:text-[#E6007E] transition">
                        Someone helps you manage your account
                      </div>
                      <div className="text-xs text-[#54617E]">Set up an authorised person through support</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0D1935] group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              </div>
            </div>

            {/* Col 2: Community forum */}
            <div className={CARD}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F5F8] flex items-center justify-center text-[#E6007E] shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">Community forum</h3>
                  <p className="text-xs text-[#54617E]">Customers helping customers</p>
                </div>
              </div>

              {/* Not available box */}
              <div className="p-4 bg-[#F8F9FC] rounded-2xl border border-[#E6E8EE] flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#E6007E] border border-[#E6E8EE] flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0D1935] mb-1">Not available</div>
                  <div className="text-xs text-[#54617E] leading-relaxed">
                    We don’t have a community forum. For help with your account, use our official support above — and never post your number, account details or codes anywhere public.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Article Reader */}
      {/* ========================================================================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-semibold text-[#E6007E] uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#0D1935]">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-xs sm:text-sm font-medium text-[#54617E]">
                {selectedArticle.subtitle}
              </p>
              <div className="space-y-2.5 pt-2">
                {selectedArticle.content.map((paragraph, idx) => (
                  <p key={idx} className="text-xs sm:text-sm text-[#0D1935] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-[#0D1935] text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Close article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: View Ticket Details & Add Reply */}
      {/* ========================================================================= */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#E6007E]">{viewingTicket.reference}</span>
                <h3 className="text-base font-bold text-[#0D1935]">{viewingTicket.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-3 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F5F8] text-[#334155]">
                  {viewingTicket.type}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    viewingTicket.status === "Awaiting your reply"
                      ? "bg-amber-50 text-amber-800"
                      : viewingTicket.status === "Under investigation"
                      ? "bg-blue-50 text-blue-700"
                      : viewingTicket.status === "Resolved"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {viewingTicket.status}
                </span>
                <span className="text-[11px] text-[#54617E]">{viewingTicket.openedDate}</span>
              </div>

              {viewingTicket.message && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-[#0D1935] leading-relaxed">
                  <div className="font-semibold text-[11px] text-[#54617E] mb-1">Original Request:</div>
                  {viewingTicket.message}
                </div>
              )}

              {/* Message Thread */}
              {viewingTicket.replies && viewingTicket.replies.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-bold text-[#0D1935]">Updates & Thread:</div>
                  {viewingTicket.replies.map((reply, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        reply.from === "support"
                          ? "bg-[#EFF8FF] border border-[#B2DDFF] text-[#0D1935]"
                          : "bg-[#FFF5F8] border border-[#FBCFE8] text-[#0D1935] ml-4"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className={reply.from === "support" ? "text-blue-700" : "text-[#E6007E]"}>
                          {reply.from === "support" ? "Zoiko Care Team" : userName}
                        </span>
                        <span className="text-[#54617E] font-normal">{reply.time}</span>
                      </div>
                      <p>{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-[#0D1935] mb-1.5">
                  Send a reply or additional information:
                </label>
                <textarea
                  rows={3}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] transition resize-none"
                />
                <div className="mt-2.5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingTicket(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendTicketReply}
                    className="px-4 py-1.5 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: New Request (Message us) */}
      {/* ========================================================================= */}
      {modal === "new_request" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">New support request</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">Category</label>
                <select
                  value={newRequestType}
                  onChange={(e) => setNewRequestType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                >
                  <option value="Question">Question</option>
                  <option value="Technical">Technical issue</option>
                  <option value="Billing">Billing & Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">Subject</label>
                <input
                  type="text"
                  value={newRequestSubject}
                  onChange={(e) => setNewRequestSubject(e.target.value)}
                  placeholder="e.g. Roaming data in Spain"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  How can we help?
                </label>
                <textarea
                  rows={4}
                  value={newRequestMessage}
                  onChange={(e) => setNewRequestMessage(e.target.value)}
                  placeholder="Provide as much context as possible..."
                  className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Make a Complaint */}
      {/* ========================================================================= */}
      {modal === "complaint" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Make a formal complaint</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="pt-4 space-y-3.5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                We take complaints very seriously. You will receive an official reference code and an assigned case handler within 24 hours.
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Complaint Summary
                </label>
                <input
                  type="text"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  placeholder="e.g. Unexpected fee on recent bill"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Full details and requested resolution
                </label>
                <textarea
                  rows={4}
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  placeholder="Explain what happened and what resolution you are seeking..."
                  className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Log complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Lost or Stolen SIM Emergency Action */}
      {/* ========================================================================= */}
      {modal === "lost_sim" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#0D1935]">Emergency SIM Protection</h3>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5">
              <p className="text-xs sm:text-sm text-[#54617E] leading-relaxed">
                If your device or SIM card has been lost or stolen, locking it prevents anyone from racking up charges or intercepting 2FA verification SMS codes.
              </p>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800">
                Line to protect: <span className="font-bold">{userPhone || "No active line registered"}</span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    showToast("Your SIM line has been suspended. Incoming/outgoing usage blocked.");
                  }}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Suspend this SIM immediately</span>
                </button>

                <Link
                  href="/dashboard/sim"
                  onClick={() => setModal(null)}
                  className="w-full py-2.5 px-4 bg-white border border-[#E6E8EE] hover:bg-slate-50 text-[#0D1935] text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Order replacement SIM / eSIM</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Report Network Issue */}
      {/* ========================================================================= */}
      {modal === "network_issue" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Report a network issue</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Location (Postcode or Area)
                </label>
                <input
                  type="text"
                  value={networkPostcode}
                  onChange={(e) => setNetworkPostcode(e.target.value)}
                  placeholder="e.g. SW1A 1AA or Manchester City Centre"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  What are you experiencing?
                </label>
                <textarea
                  rows={3}
                  value={networkIssueDesc}
                  onChange={(e) => setNetworkIssueDesc(e.target.value)}
                  placeholder="e.g. No 4G/5G data coverage indoors, dropped calls..."
                  className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setNetworkPostcode("");
                    setNetworkIssueDesc("");
                    showToast("Network report submitted to our engineering team.");
                  }}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Submit report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Extra Support Needs */}
      {/* ========================================================================= */}
      {modal === "extra_support" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Extra support needs</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5">
              <p className="text-xs text-[#54617E] leading-relaxed">
                Let us know how best to communicate with you or if you need priority restoration. You never have to disclose a medical diagnosis.
              </p>
              <textarea
                rows={3}
                value={extraSupportNeeds}
                onChange={(e) => setExtraSupportNeeds(e.target.value)}
                placeholder="e.g. Please allow extra ringing time, prefer SMS over voice calls..."
                className="w-full p-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E] resize-none"
              />
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    showToast("Support preferences updated in your account record.");
                  }}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Large Print, Braille or Audio */}
      {/* ========================================================================= */}
      {modal === "braille" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Accessible format request</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3.5">
              <p className="text-xs text-[#54617E] leading-relaxed">
                We provide statements, contract summaries, and letters in accessible formats completely free of charge.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">
                  Preferred Format
                </label>
                <select
                  value={formatPreference}
                  onChange={(e) => setFormatPreference(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                >
                  <option value="Large print (18pt)">Large print (18pt)</option>
                  <option value="Large print (24pt)">Large print (24pt)</option>
                  <option value="Grade 2 Braille">Grade 2 Braille</option>
                  <option value="Audio CD / MP3">Audio CD / MP3</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    showToast(`Preferred billing format updated to ${formatPreference}.`);
                  }}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Confirm format
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Authorised Person */}
      {/* ========================================================================= */}
      {modal === "auth_person" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0D1935]">Add authorised person</h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 space-y-3">
              <p className="text-xs text-[#54617E] leading-relaxed">
                Authorise a trusted family member or carer to contact support and make queries on your behalf.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">Full Name</label>
                <input
                  type="text"
                  value={authPersonName}
                  onChange={(e) => setAuthPersonName(e.target.value)}
                  placeholder="e.g. Jane Morgan"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">Relationship</label>
                <input
                  type="text"
                  value={authPersonRelation}
                  onChange={(e) => setAuthPersonRelation(e.target.value)}
                  placeholder="e.g. Spouse / Daughter / Carer"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0D1935] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={authPersonPhone}
                  onChange={(e) => setAuthPersonPhone(e.target.value)}
                  placeholder="e.g. 07700 900456"
                  className="w-full h-10 px-3 rounded-xl border border-[#E6E8EE] text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E6007E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#54617E] hover:text-[#0D1935]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setAuthPersonName("");
                    setAuthPersonRelation("");
                    setAuthPersonPhone("");
                    showToast("Authorised representative added to your account.");
                  }}
                  className="px-4 py-2 bg-[#E6007E] hover:bg-[#D80070] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Add representative
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================* OLD CODE (previous version, kept for reference — not used)
 * ============================================================================

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaHeadset,
  FaCommentDots,
  FaPhone,
  FaTicketAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/support/`;

interface Toast {
  msg: string;
  type: "success" | "error" | "";
}

interface TicketForm {
  subject: string;
  category: string;
  message: string;
}

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: "Open" | "In Progress" | "Resolved";
  created_at: string;
}

const initialForm: TicketForm = {
  subject: "",
  category: "general",
  message: "",
};

export default function SupportPage() {
  const [token, setToken] = useState<string>("");
  const [form, setForm] = useState<TicketForm>(initialForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>({ msg: "", type: "" });
  const [callbackPhone, setCallbackPhone] = useState<string>("");
  const [callbackLoading, setCallbackLoading] = useState<boolean>(false);

  // Demo ticket history — replace with API result when ready.
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 1041, subject: "Cannot activate eSIM", category: "Technical", status: "Resolved", created_at: "10 May, 2026" },
    { id: 1042, subject: "Billing question on May invoice", category: "Billing", status: "In Progress", created_at: "12 May, 2026" },
    { id: 1043, subject: "Plan change request", category: "Account", status: "Open", created_at: "14 May, 2026" },
  ]);

  // ── Load token (optional — auth gating disabled) ──
  useEffect(() => {
    const storedToken = localStorage.getItem("driverx_token") || "";
    setToken(storedToken);
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Submit support ticket ──
  const submitTicket = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      showToast("Please add a subject and a message.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}tickets/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast("Ticket submitted. We'll be in touch soon.", "success");
      } else {
        showToast("Ticket received (local). We'll follow up by email.", "success");
      }

      // Optimistically append to the visible list so the user gets feedback.
      setTickets((prev) => [
        {
          id: Math.max(0, ...prev.map((p) => p.id)) + 1,
          subject: form.subject,
          category:
            form.category.charAt(0).toUpperCase() + form.category.slice(1),
          status: "Open",
          created_at: new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        },
        ...prev,
      ]);
      setForm(initialForm);
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setSubmitting(false);
  };

  // ── Request a call-back ──
  const requestCallback = async () => {
    if (!/^\+?\d{7,15}$/.test(callbackPhone.trim())) {
      showToast("Please enter a valid phone number.", "error");
      return;
    }
    setCallbackLoading(true);
    try {
      const res = await fetch(`${BASE_URL}callback/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: callbackPhone }),
      });

      if (res.ok) {
        showToast("Call-back requested. We'll call you shortly.", "success");
      } else {
        showToast("Request received (local). We'll call you back.", "success");
      }
      setCallbackPhone("");
    } catch {
      showToast("Network error. Please try again.", "error");
    }
    setCallbackLoading(false);
  };

  // ── Start live chat ──
  const openChat = (): void => {
    const tawk = window as Window & { Tawk_API?: { maximize: () => void } };
    if (tawk.Tawk_API) {
      tawk.Tawk_API.maximize();
    } else {
      showToast("Chat is loading… please try again in a moment.", "error");
    }
  };

  const statusBadgeClass = useMemo(
    () => (status: Ticket["status"]) => {
      if (status === "Resolved") return "bg-green-100 text-green-700 border-green-300";
      if (status === "In Progress") return "bg-yellow-100 text-yellow-800 border-yellow-300";
      return "bg-blue-100 text-blue-700 border-blue-300";
    },
    []
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Page Header *\/}
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold">Support</h4>
          </div>

          {/* Toast *\/}
          {toast.msg && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded mb-6 border text-sm ${
              toast.type === "success"
                ? "bg-green-50 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}>
              {toast.type === "success"
                ? <FaCheckCircle className="text-green-500" />
                : <FaExclamationCircle className="text-red-500" />
              }
              {toast.msg}
            </div>
          )}

          {/* Quick actions row *\/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            {/* Live chat *\/}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-green-500 text-xl">
                  <FaCommentDots />
                </div>
                <h5 className="font-semibold text-base">Live Chat</h5>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Chat with a support agent in real time. Available 24/7.
              </p>
              <button
                onClick={openChat}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Start Chat
              </button>
            </div>

            {/* Call-back *\/}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-green-500 text-xl">
                  <FaPhone />
                </div>
                <h5 className="font-semibold text-base">Request a Call-back</h5>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Leave your number and our team will call you back.
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={callbackPhone}
                  onChange={(e) => setCallbackPhone(e.target.value)}
                  className="flex-1 min-w-[180px] h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
                <button
                  onClick={requestCallback}
                  disabled={callbackLoading}
                  className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {callbackLoading ? "Requesting..." : "Request Call"}
                </button>
              </div>
            </div>

          </div>

          {/* Create Ticket *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaTicketAlt />
              </div>
              <h5 className="font-semibold text-base">Create a Support Ticket</h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of the issue"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="account">Account</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                Describe your issue
              </label>
              <textarea
                rows={4}
                placeholder="Share as much detail as you can — error messages, what you tried, when it started..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={submitTicket}
                disabled={submitting}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Submitting..." : "Create Ticket"}
              </button>
              <button
                onClick={() => setForm(initialForm)}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Ticket History *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-green-500 text-xl">
                <FaHeadset />
              </div>
              <h5 className="font-semibold text-base">Ticket History</h5>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 font-medium">#</th>
                    <th className="py-2 font-medium">Subject</th>
                    <th className="py-2 font-medium">Category</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-gray-400 dark:text-gray-500"
                      >
                        No tickets yet.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <td className="py-3">#{t.id}</td>
                        <td className="py-3">{t.subject}</td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">{t.category}</td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded-full border ${statusBadgeClass(t.status)}`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">{t.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}


*/
