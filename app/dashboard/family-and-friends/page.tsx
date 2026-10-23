"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import beQuick from "../../utils/dasdbeQuickApi";
import {
  Users,
  UserPlus,
  RotateCw,
  Clock,
  Info,
  Database,
  FileText,
  Smartphone,
  CreditCard,
  Check,
  Mail,
  Plus,
  Lock,
  Settings,
  Bell,
  Gauge,
  Ban,
  BarChart2,
  Crown,
  Zap,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  MoreHorizontal,
  X,
  CheckCircle2,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { validateEmail, validateUkMobile, validateName } from "../../utils/validators";

interface FamilyLineRecord {
  id: string;
  number: string;
  maskedNumber: string;
  planName: string;
  monthlyPrice: number;
  dataUsedGb: number;
  dataTotalGb: number;
  renewDate: string;
  isOwnerLine: boolean;
  memberName: string;
  roleLabel: string;
  sharesUsageSummary: boolean;
  status: "Active";
}

interface PendingInviteRecord {
  id: string;
  displayName: string;
  rawContact: string;
  maskedContact: string;
  roleLabel: string;
  expiresLabel: string;
  createdAt: string;
}

const MAX_GROUP_SEATS = 6;

function getInitials(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "ZM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatUkPhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";
  const normalized = digits.startsWith("44")
    ? "0" + digits.slice(2)
    : digits.startsWith("0")
    ? digits
    : "0" + digits;
  if (normalized.length === 11) {
    return `${normalized.slice(0, 5)} ${normalized.slice(5)}`;
  }
  return normalized;
}

function maskPhoneNumber(formattedPhone: string): string {
  const digits = String(formattedPhone || "").replace(/\D/g, "");
  if (digits.length >= 10) {
    const prefix = digits.slice(0, 5);
    const suffix = digits.slice(-3);
    return `${prefix} •••${suffix}`;
  }
  return formattedPhone || "Number hidden";
}

function maskContactString(contact: string): string {
  const trimmed = String(contact || "").trim();
  if (trimmed.includes("@")) {
    const [local, domain] = trimmed.split("@");
    const firstChar = local ? local[0] : "u";
    return `${firstChar}•••••@${domain || "example.com"}`;
  }
  return maskPhoneNumber(formatUkPhone(trimmed));
}

export default function FamilyAndFriendsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("family");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [freshnessLabel, setFreshnessLabel] = useState("");
  const [billingWindowLabel, setBillingWindowLabel] = useState("");

  // Authenticated account holder info
  const [userName, setUserName] = useState("Member");
  const [userEmail, setUserEmail] = useState("");
  const [householdName, setHouseholdName] = useState("Your household");
  const [accountSuffix, setAccountSuffix] = useState("");

  // Dynamic lines & members
  const [lines, setLines] = useState<FamilyLineRecord[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRecord[]>([]);
  const [memberOverrides, setMemberOverrides] = useState<
    Record<string, { name?: string; sharesUsageSummary?: boolean; hidden?: boolean }>
  >({});

  // Invite form state
  const [inviteContact, setInviteContact] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);

  // Action menus & modals
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<{
    id: string;
    name: string;
    isOwner: boolean;
    sharesUsageSummary: boolean;
  } | null>(null);
  const [memberEditError, setMemberEditError] = useState<string>("");

  const [editHouseholdModalOpen, setEditHouseholdModalOpen] = useState(false);
  const [draftHouseholdName, setDraftHouseholdName] = useState("");
  const [householdNameError, setHouseholdNameError] = useState<string>("");

  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  // Usage alerts modal
  const [usageAlertsModalOpen, setUsageAlertsModalOpen] = useState(false);
  const [alertAt80Pct, setAlertAt80Pct] = useState(true);
  const [alertAt100Pct, setAlertAt100Pct] = useState(true);

  // Help modal
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inviteFormRef = useRef<HTMLDivElement | null>(null);
  const inviteInputRef = useRef<HTMLInputElement | null>(null);
  const membersSectionRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const scrollToInviteForm = () => {
    inviteFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      inviteInputRef.current?.focus();
    }, 350);
  };

  const fetchFamilyData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateStr = now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      setFreshnessLabel(`${timeStr} BST, ${dateStr}`);

      const cycleStart = new Date(now);
      cycleStart.setDate(now.getDate() - 16);
      const cycleEnd = new Date(now);
      cycleEnd.setDate(now.getDate() + 13);
      setBillingWindowLabel(
        `As of ${timeStr} BST, ${dateStr} · ${cycleStart.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })} – ${cycleEnd.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`
      );

      let email = "";
      let name = "Member";
      let token = "";

      if (typeof window !== "undefined") {
        token = localStorage.getItem("zoiko_token") || "";
        const userStr = localStorage.getItem("zoiko_user");
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            email = parsed.email || "";
            name =
              [parsed.first_name, parsed.last_name].filter(Boolean).join(" ") ||
              parsed.name ||
              (email ? email.split("@")[0] : "Member");
          } catch {
            // ignore
          }
        }
      }

      setUserEmail(email);
      setUserName(name);

      // Load persisted invites, member overrides, and household name for this user
      const storageKeySuffix = email || "default";
      let savedOverrides: Record<
        string,
        { name?: string; sharesUsageSummary?: boolean; hidden?: boolean }
      > = {};

      if (typeof window !== "undefined") {
        const rawInvites = localStorage.getItem(
          `zoiko_family_invites_${storageKeySuffix}`
        );
        if (rawInvites) {
          try {
            setPendingInvites(JSON.parse(rawInvites));
          } catch {
            // ignore
          }
        }
        const rawOverrides = localStorage.getItem(
          `zoiko_family_overrides_${storageKeySuffix}`
        );
        if (rawOverrides) {
          try {
            savedOverrides = JSON.parse(rawOverrides);
            setMemberOverrides(savedOverrides);
          } catch {
            // ignore
          }
        }
        const savedAlerts = localStorage.getItem(
          `zoiko_family_alerts_${storageKeySuffix}`
        );
        if (savedAlerts) {
          try {
            const parsedAlerts = JSON.parse(savedAlerts);
            if (typeof parsedAlerts.alertAt80Pct === "boolean") {
              setAlertAt80Pct(parsedAlerts.alertAt80Pct);
            }
            if (typeof parsedAlerts.alertAt100Pct === "boolean") {
              setAlertAt100Pct(parsedAlerts.alertAt100Pct);
            }
          } catch {
            // ignore
          }
        }
      }

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      let djangoOrders: any[] = [];
      let catalogPlans: any[] = [];

      if (token && email) {
        const [ordersRes, plansRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
            method: "POST",
            headers: {
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ logged_user: email }),
          }).catch(() => null),
          fetch(`${API_BASE}/api/plans/v1/`).catch(() => null),
        ]);

        if (ordersRes && ordersRes.ok) {
          const data = await ordersRes.json();
          if (data?.orders && Array.isArray(data.orders)) {
            djangoOrders = data.orders;
          } else if (Array.isArray(data)) {
            djangoOrders = data;
          }
        }
        if (plansRes && plansRes.ok) {
          const pData = await plansRes.json();
          catalogPlans = Array.isArray(pData) ? pData : pData?.results || [];
        }
      }

      let subscriberId: string | number | null = null;
      let bqLines: any[] = [];
      let bqDetails: any = null;

      if (email) {
        const subLookup = await beQuick.getSubscriberByEmail(email);
        subscriberId =
          subLookup && subLookup.subscriber_id ? subLookup.subscriber_id : null;

        if (subscriberId) {
          const [detailsRes, linesRes] = await Promise.all([
            beQuick.getSubscriberDetails(subscriberId),
            beQuick.getUserLines(subscriberId),
          ]);
          bqDetails = detailsRes;
          bqLines = Array.isArray(linesRes)
            ? linesRes
            : linesRes?.lines || detailsRes?.subscribers?.[0]?.lines || [];
        }
      }

      const subObj = bqDetails?.subscribers?.[0];
      let resolvedFullName = name;
      if (subObj) {
        const fullName = [subObj.first_name, subObj.last_name]
          .filter(Boolean)
          .join(" ");
        if (fullName) {
          resolvedFullName = fullName;
          setUserName(fullName);
        }
      }

      // Derive household name dynamically from user's surname unless customized
      const savedGroupTitle =
        typeof window !== "undefined"
          ? localStorage.getItem(`zoiko_household_name_${storageKeySuffix}`)
          : null;
      if (savedGroupTitle) {
        setHouseholdName(savedGroupTitle);
      } else {
        const nameParts = resolvedFullName.trim().split(/\s+/).filter(Boolean);
        const surname =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
        setHouseholdName(
          surname && surname.toLowerCase() !== "member"
            ? `${surname} household`
            : "Your household"
        );
      }

      const firstOrder = djangoOrders[0];
      const suffix = subscriberId
        ? String(subscriberId).slice(-4)
        : firstOrder?.id
        ? String(firstOrder.id).slice(-4)
        : "";
      setAccountSuffix(suffix);

      const assembledLines: FamilyLineRecord[] = [];

      if (bqLines.length > 0) {
        for (let idx = 0; idx < bqLines.length; idx++) {
          const l = bqLines[idx];
          const lineId = String(l.id || `line-${idx + 1}`);
          const rawMsisdn = l.mdn || l.msisdn || l.phone_number || "";
          const formattedMsisdn = rawMsisdn
            ? formatUkPhone(rawMsisdn)
            : `SIM #${idx + 1}`;

          let planName = l.plan_name || "Zoiko Mobile Plan";
          let dataTotalGb = 30;
          let dataUsedGb = 0;
          let renewDate = "28 Oct";
          let monthlyPrice = 19.99;

          try {
            const [planRes, bucketsRes] = await Promise.all([
              beQuick.getPlanDetails(lineId),
              beQuick.getLineBuckets(lineId),
            ]);
            if (planRes?.plan?.name) {
              planName = planRes.plan.name;
            }
            if (planRes?.plan?.price || planRes?.plan?.amount) {
              const p = parseFloat(planRes.plan.price || planRes.plan.amount);
              if (!isNaN(p) && p > 0) monthlyPrice = p;
            }
            const buckets =
              bucketsRes?.buckets || bucketsRes?.service_buckets || [];
            const dataBucket = buckets.find((b: any) =>
              String(b.bucket_type || b.type || "")
                .toLowerCase()
                .includes("data")
            );
            if (dataBucket) {
              const totalKb = Number(
                dataBucket.total || dataBucket.initial_quantity || 0
              );
              const remKb = Number(
                dataBucket.remaining || dataBucket.balance || 0
              );
              if (totalKb > 0) {
                dataTotalGb = Math.max(
                  1,
                  Math.round((totalKb / (1024 * 1024)) * 10) / 10
                );
                const remGb = Math.max(
                  0,
                  Math.round((remKb / (1024 * 1024)) * 10) / 10
                );
                dataUsedGb = Math.max(
                  0,
                  Math.round((dataTotalGb - remGb) * 10) / 10
                );
              }
              if (dataBucket.end_at || dataBucket.expires_at) {
                const d = new Date(dataBucket.end_at || dataBucket.expires_at);
                if (!isNaN(d.getTime())) {
                  renewDate = d.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  });
                }
              }
            }
          } catch {
            // fallback to catalog match
          }

          const matchedCatalog = catalogPlans.find(
            (cp: any) =>
              String(cp.title || "").toLowerCase() ===
              String(planName).toLowerCase()
          );
          if (matchedCatalog?.price) {
            const cpPrice = parseFloat(matchedCatalog.price);
            if (!isNaN(cpPrice) && cpPrice > 0) monthlyPrice = cpPrice;
          }

          const isOwnerLine = idx === 0;
          const defaultMemberName = isOwnerLine
            ? resolvedFullName
            : l.label || l.nickname || `Line ${idx + 1} member`;

          assembledLines.push({
            id: lineId,
            number: formattedMsisdn,
            maskedNumber: isOwnerLine
              ? formattedMsisdn
              : maskPhoneNumber(formattedMsisdn),
            planName,
            monthlyPrice,
            dataUsedGb,
            dataTotalGb,
            renewDate,
            isOwnerLine,
            memberName: defaultMemberName,
            roleLabel: isOwnerLine ? "Group owner · bill payer" : "Adult member",
            sharesUsageSummary: true,
            status: "Active",
          });
        }
      }

      if (assembledLines.length === 0 && djangoOrders.length > 0) {
        djangoOrders.forEach((ord: any, idx: number) => {
          const lineId = String(ord.id || `order-line-${idx + 1}`);
          const planTitle =
            ord.plan_title ||
            ord.plan?.title ||
            ord.items?.[0]?.plan_title ||
            "Zoiko Mobile Plan";
          const matchedCatalog = catalogPlans.find(
            (cp: any) =>
              String(cp.title || "").toLowerCase() ===
              String(planTitle).toLowerCase()
          );
          const parsedAllowance = parseFloat(
            String(matchedCatalog?.data_allowance || "30").replace(/[^\d.]/g, "")
          );
          const totalGb =
            !isNaN(parsedAllowance) && parsedAllowance > 0 ? parsedAllowance : 30;

          const parsedPrice = parseFloat(
            String(
              ord.total_amount ||
                ord.amount ||
                matchedCatalog?.price ||
                "19.99"
            ).replace(/[^\d.]/g, "")
          );
          const monthlyPrice =
            !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 19.99;

          const rawPhone =
            ord.msisdn ||
            ord.phone_number ||
            ord.port_in_number ||
            ord.billing_address?.phone ||
            "";
          const formattedPhone = rawPhone
            ? formatUkPhone(rawPhone)
            : `Order #${ord.id || idx + 1}`;

          const isOwnerLine = idx === 0;
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const renewStr = nextMonth.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          });

          assembledLines.push({
            id: lineId,
            number: formattedPhone,
            maskedNumber: isOwnerLine
              ? formattedPhone
              : maskPhoneNumber(formattedPhone),
            planName: planTitle,
            monthlyPrice,
            dataUsedGb: 0,
            dataTotalGb: totalGb,
            renewDate: renewStr,
            isOwnerLine,
            memberName: isOwnerLine
              ? resolvedFullName
              : ord.recipient_name || `Member ${idx + 1}`,
            roleLabel: isOwnerLine ? "Group owner · bill payer" : "Adult member",
            sharesUsageSummary: true,
            status: "Active",
          });
        });
      }

      // Ensure at least the authenticated account holder appears as owner if they have no orders yet
      if (assembledLines.length === 0) {
        assembledLines.push({
          id: "owner-primary",
          number: "No active SIM yet",
          maskedNumber: "No active SIM yet",
          planName: "No active plan",
          monthlyPrice: 0,
          dataUsedGb: 0,
          dataTotalGb: 0,
          renewDate: "—",
          isOwnerLine: true,
          memberName: resolvedFullName,
          roleLabel: "Group owner · bill payer",
          sharesUsageSummary: true,
          status: "Active",
        });
      }

      setLines(assembledLines);
    } catch (err) {
      console.error("Failed to load Family & friends data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilyData(false);
  }, [fetchFamilyData]);

  // Apply user overrides (custom nicknames, sharing toggles, removed secondary members)
  const visibleActiveMembers = lines
    .filter((l) => l.isOwnerLine || !memberOverrides[l.id]?.hidden)
    .map((l) => ({
      ...l,
      memberName: memberOverrides[l.id]?.name || l.memberName,
      sharesUsageSummary:
        memberOverrides[l.id]?.sharesUsageSummary ?? l.sharesUsageSummary,
    }));

  const activeCount = visibleActiveMembers.length;
  const pendingCount = pendingInvites.length;
  const freeSeatsCount = Math.max(
    0,
    MAX_GROUP_SEATS - activeCount - pendingCount
  );

  const storageKeySuffix = userEmail || "default";

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    const contact = inviteContact.trim();
    if (!contact) {
      setInviteError("Please enter an email address or UK mobile number.");
      return;
    }

    const emailRes = validateEmail(contact);
    const mobileRes = validateUkMobile(contact);

    if (!emailRes.isValid && !mobileRes.isValid) {
      setInviteError(
        "Enter a valid email address (e.g. name@example.com) or 11-digit UK mobile number starting with 07."
      );
      return;
    }

    // Name validation if provided
    if (inviteName.trim()) {
      const nameCheck = validateName(inviteName, "Name");
      if (!nameCheck.isValid) {
        setInviteError(nameCheck.error || "Please enter a valid member name.");
        return;
      }
    }

    // Check self-invite
    if (
      (emailRes.isValid && userEmail && emailRes.normalized === userEmail.toLowerCase()) ||
      (mobileRes.isValid &&
        visibleActiveMembers.some(
          (m) =>
            m.isOwnerLine &&
            m.number.replace(/\D/g, "").endsWith(contact.replace(/\D/g, "").slice(-10))
        ))
    ) {
      setInviteError("You cannot invite yourself — you are the group owner.");
      return;
    }

    // Check already active member
    const isAlreadyActive = visibleActiveMembers.some((m) => {
      const cleanNum = m.number.replace(/\D/g, "");
      const cleanContact = contact.replace(/\D/g, "");
      return cleanContact && cleanNum.endsWith(cleanContact.slice(-10));
    });
    if (isAlreadyActive) {
      setInviteError("This mobile number is already an active member in your group.");
      return;
    }

    // Check already pending invite
    const isAlreadyPending = pendingInvites.some((inv) => {
      if (emailRes.isValid && inv.rawContact.toLowerCase() === contact.toLowerCase()) return true;
      if (mobileRes.isValid) {
        const invDigits = inv.rawContact.replace(/\D/g, "");
        const inputDigits = contact.replace(/\D/g, "");
        return invDigits.endsWith(inputDigits.slice(-10));
      }
      return false;
    });
    if (isAlreadyPending) {
      setInviteError("An invitation has already been sent to this contact.");
      return;
    }

    if (freeSeatsCount <= 0) {
      setInviteError(
        "All 6 seats in your group are currently active or held by pending invites."
      );
      return;
    }

    setIsSendingInvite(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("zoiko_token") : null;
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/support/tickets/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: "general",
            subject: `Family Group Invite: ${contact}`,
            message: `Group owner (${userEmail || "Account"}) sent a family invitation to ${contact} (${inviteName.trim() || "Member"}) for household group "${householdName}".`,
          }),
        }).catch(() => {});
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);
      const expiresLabel = `Expires ${expiry.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      })}`;

      const fallbackDisplayName =
        inviteName.trim() ||
        (emailRes.isValid
          ? contact.split("@")[0]
          : `Invited (${contact.replace(/\D/g, "").slice(-3)})`);

      const newInvite: PendingInviteRecord = {
        id: `invite-${Date.now()}`,
        displayName: fallbackDisplayName,
        rawContact: contact,
        maskedContact: maskContactString(contact),
        roleLabel: "Adult member",
        expiresLabel,
        createdAt: new Date().toISOString(),
      };

      const updated = [...pendingInvites, newInvite];
      setPendingInvites(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `zoiko_family_invites_${storageKeySuffix}`,
          JSON.stringify(updated)
        );
      }

      setInviteContact("");
      setInviteName("");
      showToast(`Invitation sent to ${newInvite.displayName}`);
    } catch {
      setInviteError("Could not send invitation. Please try again or contact support.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRevokeInvite = (inviteId: string) => {
    const target = pendingInvites.find((i) => i.id === inviteId);
    const updated = pendingInvites.filter((i) => i.id !== inviteId);
    setPendingInvites(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_family_invites_${storageKeySuffix}`,
        JSON.stringify(updated)
      );
    }
    setOpenMenuId(null);
    showToast(`Cancelled invite for ${target?.displayName || "member"}`);
  };

  const handleResendInvite = (inviteId: string) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const expiresLabel = `Expires ${expiry.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;

    const updated = pendingInvites.map((inv) =>
      inv.id === inviteId ? { ...inv, expiresLabel } : inv
    );
    setPendingInvites(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_family_invites_${storageKeySuffix}`,
        JSON.stringify(updated)
      );
    }
    setOpenMenuId(null);
    showToast("Invitation resent for another 7 days.");
  };

  const handleSaveMemberEdit = () => {
    if (!editingMember) return;
    const nameCheck = validateName(editingMember.name, "Member name");
    if (!nameCheck.isValid) {
      setMemberEditError(nameCheck.error || "Please enter a valid member name.");
      return;
    }
    setMemberEditError("");

    const nextOverrides = {
      ...memberOverrides,
      [editingMember.id]: {
        ...memberOverrides[editingMember.id],
        name: nameCheck.cleaned || editingMember.name.trim(),
        sharesUsageSummary: editingMember.sharesUsageSummary,
      },
    };
    setMemberOverrides(nextOverrides);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_family_overrides_${storageKeySuffix}`,
        JSON.stringify(nextOverrides)
      );
    }
    setEditingMember(null);
    showToast("Member settings updated.");
  };

  const handleConfirmRemoveMember = () => {
    if (!memberToRemove) return;
    const lineId = memberToRemove.id;
    const memberName = memberToRemove.name;
    const nextOverrides = {
      ...memberOverrides,
      [lineId]: {
        ...memberOverrides[lineId],
        hidden: true,
      },
    };
    setMemberOverrides(nextOverrides);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_family_overrides_${storageKeySuffix}`,
        JSON.stringify(nextOverrides)
      );
    }
    setMemberToRemove(null);
    setOpenMenuId(null);
    showToast(`${memberName} removed from group.`);
  };

  const handleSaveHouseholdName = () => {
    const cleaned = draftHouseholdName.trim();
    if (!cleaned || cleaned.length < 3 || cleaned.length > 50) {
      setHouseholdNameError("Group name must be between 3 and 50 characters.");
      return;
    }
    setHouseholdNameError("");
    setHouseholdName(cleaned);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_household_name_${storageKeySuffix}`,
        cleaned
      );
    }
    setEditHouseholdModalOpen(false);
    showToast("Group name updated.");
  };

  const handleSaveUsageAlerts = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `zoiko_family_alerts_${storageKeySuffix}`,
        JSON.stringify({ alertAt80Pct, alertAt100Pct })
      );
    }
    setUsageAlertsModalOpen(false);
    showToast("Usage alert preferences saved.");
  };

  const primaryLine = visibleActiveMembers[0];

  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-4 md:p-5">
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Sticky Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            numbersCount={lines.filter((l) => l.number !== "No active SIM yet").length}
            planName={primaryLine?.planName || "Zoiko Mobile"}
            renewDate={primaryLine?.renewDate || "28 Oct"}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Top Navigation Bar */}
          <DashboardTopNav
            userName={userName}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="Family & friends"
            customSubtitle="See who’s in your group, invite people and choose what each person shares."
          />

          {/* Sub-header Freshness Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#4C566A]">
              <Clock className="w-3.5 h-3.5 text-[#4C566A]" />
              <span>Group checked {freshnessLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchFamilyData(true)}
              disabled={refreshing}
              title="Refresh group details"
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#0D1935] hover:bg-white/60 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {toastMessage && (
            <div className="bg-[#0D1935] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9F6E]" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />
              <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />
              <div className="h-64 rounded-3xl bg-white/70 animate-pulse" />
            </div>
          ) : (
            <>
              {/* ROW 1: 3 Equal Columns (Household Pink Card, Shared Data Pool, Group Plan) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Card 1: Household Overview (Solid Pink #E01C5B) */}
                <div className="relative bg-[#E01C5B] rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] flex flex-col justify-between overflow-hidden text-white">
                  {/* Decorative 6x3 White Dot Matrix */}
                  <div className="w-24 h-12 absolute right-4 top-4 opacity-10 pointer-events-none grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-white block"
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-3.5 relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/16 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="text-lg font-bold text-white leading-6">
                              {householdName}
                            </h2>
                            <button
                              type="button"
                              onClick={() => {
                                setDraftHouseholdName(householdName);
                                setEditHouseholdModalOpen(true);
                              }}
                              title="Rename group"
                              className="text-white/70 hover:text-white transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-white/85 leading-5">
                            Your group · owner {userName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Seat Count */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-4xl font-extrabold text-white leading-9">
                        {activeCount}
                      </span>
                      <span className="text-base font-semibold text-white/80 leading-4">
                        active of {MAX_GROUP_SEATS} seats
                      </span>
                    </div>

                    {/* 6-Seat Segmented Bar */}
                    <div className="grid grid-cols-6 gap-1 pt-1">
                      {Array.from({ length: MAX_GROUP_SEATS }).map((_, idx) => {
                        const isActiveSeat = idx < activeCount;
                        const isPendingSeat =
                          idx >= activeCount &&
                          idx < activeCount + pendingCount;
                        return (
                          <div
                            key={idx}
                            className={`h-2.5 rounded-[5px] ${
                              isActiveSeat
                                ? "bg-white"
                                : isPendingSeat
                                ? "bg-white/65"
                                : "bg-white/25"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3.5 text-xs text-white/90">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-xs bg-white inline-block" />
                        <span>{activeCount} active</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-xs bg-white/60 inline-block" />
                        <span>
                          {pendingCount === 1
                            ? "1 invite pending (seat held)"
                            : `${pendingCount} invites pending`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-2 rounded-xs bg-white/25 inline-block" />
                        <span>{freeSeatsCount} free</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Invite CTA Button */}
                  <div className="pt-8 relative z-10">
                    <button
                      type="button"
                      onClick={scrollToInviteForm}
                      className="h-9 px-3.5 py-2 bg-white hover:bg-white/95 text-[#BA1248] rounded-[10px] inline-flex items-center gap-2 text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-4 h-4 text-[#BA1248]" />
                      <span>Invite someone</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Shared data pool */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Shared data pool
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Data shared across members
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Info className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-[#0D1935] leading-5">
                          No shared pool on your current plans
                        </div>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Each number keeps its own allowance. Joining this
                          group doesn’t share anyone’s data.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/dashboard/usage-and-allowances"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E01C5B] hover:underline"
                    >
                      <span>See each line’s allowance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Card 3: Group plan */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-3.5">
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Group plan
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Each number has its own plan
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Info className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-sm font-bold text-[#0D1935] leading-5">
                          No group plan
                        </div>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Being in a group doesn’t change anyone’s plan or bill.
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Per-Line Plan & Price List */}
                    <div className="flex flex-col gap-2 pt-1">
                      {visibleActiveMembers.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-start gap-2 text-xs text-[#0D1935] leading-5"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-[#0D9F6E] shrink-0 mt-0.5" />
                          <span>
                            {line.number} · {line.planName}
                            {line.monthlyPrice > 0
                              ? ` · £${line.monthlyPrice.toFixed(2)} a month`
                              : ""}
                          </span>
                        </div>
                      ))}

                      <div className="flex items-start gap-2 text-xs text-[#0D1935] leading-5">
                        <CreditCard className="w-3.5 h-3.5 text-[#0D9F6E] shrink-0 mt-0.5" />
                        <span>
                          {visibleActiveMembers.length === 1
                            ? "Billed to your account"
                            : visibleActiveMembers.length === 2
                            ? "Both billed to your account"
                            : "All billed to your account"}{" "}
                          {accountSuffix ? `••${accountSuffix}` : "on file"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: Group Members (7 cols) + Sharing Settings & Usage by Member (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left Column (7 cols): Group members */}
                <div
                  ref={membersSectionRef}
                  className="lg:col-span-7 bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                            Group members
                          </h2>
                          <p className="text-xs text-[#4C566A] leading-5">
                            Names you choose · numbers are masked for others
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={scrollToInviteForm}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer"
                      >
                        <span>Invite someone</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Table Header */}
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs font-semibold text-[#4C566A]">
                            <th className="pb-2 px-1.5 font-semibold">
                              Member and number
                            </th>
                            <th className="pb-2 px-1.5 font-semibold">Shares</th>
                            <th className="pb-2 px-1.5 font-semibold">Status</th>
                            <th className="pb-2 px-1.5 w-10 text-right" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#121B34]/8 text-xs">
                          {/* Active Members */}
                          {visibleActiveMembers.map((member) => {
                            const initials = getInitials(member.memberName);
                            return (
                              <tr key={member.id} className="group">
                                <td className="py-3 px-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                                        member.isOwnerLine
                                          ? "bg-[#E01C5B]/13 text-[#E01C5B]"
                                          : "bg-[#0D1935]/12 text-[#0D1935]"
                                      }`}
                                    >
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-[#0D1935] leading-5 truncate">
                                        {member.memberName}
                                        {member.isOwnerLine ? " (you)" : ""}
                                      </div>
                                      <div className="text-xs text-[#4C566A] leading-4 truncate">
                                        {member.roleLabel} ·{" "}
                                        {member.isOwnerLine
                                          ? member.number
                                          : member.maskedNumber}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-1.5 align-middle">
                                  {member.isOwnerLine ? (
                                    <span className="text-xs text-[#0D1935]">
                                      —
                                    </span>
                                  ) : member.sharesUsageSummary ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F6F7FA] text-[#3B4866] text-xs font-semibold">
                                      Usage summary
                                    </span>
                                  ) : (
                                    <span className="text-xs text-[#4C566A]">
                                      Nothing shared
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-1.5 align-middle">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0D9F6E]/12 text-[#0A7B56] text-xs font-semibold">
                                    <Check className="w-3 h-3" />
                                    Active
                                  </span>
                                </td>

                                <td className="py-3 px-1.5 align-middle text-right relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId === member.id
                                          ? null
                                          : member.id
                                      )
                                    }
                                    className="w-8 h-8 rounded-[10px] inline-flex items-center justify-center text-[#0D1935] hover:bg-slate-100 transition cursor-pointer"
                                    aria-label="Member options"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  {openMenuId === member.id && (
                                    <div className="absolute right-2 top-11 z-30 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 text-left">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setEditingMember({
                                            id: member.id,
                                            name: member.memberName,
                                            isOwner: member.isOwnerLine,
                                            sharesUsageSummary:
                                              member.sharesUsageSummary,
                                          });
                                        }}
                                        className="w-full px-3.5 py-2 text-xs font-medium text-[#0D1935] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-[#4C566A]" />
                                        <span>Edit display name</span>
                                      </button>
                                      {!member.isOwnerLine && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            setMemberToRemove({
                                              id: member.id,
                                              name: member.memberName,
                                            });
                                          }}
                                          className="w-full px-3.5 py-2 text-xs font-medium text-[#E01C5B] hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Remove from group</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Pending Invites */}
                          {pendingInvites.map((invite) => {
                            const initials = getInitials(invite.displayName);
                            return (
                              <tr key={invite.id}>
                                <td className="py-3 px-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-2xl bg-[#F59E0B]/15 text-[#D97706] flex items-center justify-center text-xs font-bold shrink-0">
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-[#0D1935] leading-5 truncate">
                                        {invite.displayName}
                                      </div>
                                      <div className="text-xs text-[#4C566A] leading-4 truncate">
                                        {invite.roleLabel} ·{" "}
                                        {invite.maskedContact}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-1.5 align-middle">
                                  <span className="text-xs text-[#0D1935]">
                                    —
                                  </span>
                                </td>

                                <td className="py-3 px-1.5 align-middle">
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3B4866]/10 text-[#3B4866] text-xs font-semibold">
                                      <Mail className="w-3 h-3" />
                                      Invited
                                    </span>
                                    <span className="text-[11px] text-[#4C566A]">
                                      {invite.expiresLabel}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-1.5 align-middle text-right relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId === invite.id
                                          ? null
                                          : invite.id
                                      )
                                    }
                                    className="w-8 h-8 rounded-[10px] inline-flex items-center justify-center text-[#0D1935] hover:bg-slate-100 transition cursor-pointer"
                                    aria-label="Invite options"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  {openMenuId === invite.id && (
                                    <div className="absolute right-2 top-11 z-30 w-44 bg-white rounded-2xl shadow-lg border border-slate-100 py-1.5 text-left">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleResendInvite(invite.id)
                                        }
                                        className="w-full px-3.5 py-2 text-xs font-medium text-[#0D1935] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Mail className="w-3.5 h-3.5 text-[#4C566A]" />
                                        <span>Resend invite</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRevokeInvite(invite.id)
                                        }
                                        className="w-full px-3.5 py-2 text-xs font-medium text-[#E01C5B] hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Cancel invite</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Add a member row */}
                    <div className="px-2 py-3 border-t border-[#121B34]/8 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl border border-[#E01C5B]/30 flex items-center justify-center text-[#E01C5B] shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#0D1935] leading-5">
                            Add a member
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            {freeSeatsCount}{" "}
                            {freeSeatsCount === 1 ? "seat" : "seats"} free ·
                            invites last 7 days
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={scrollToInviteForm}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#E01C5B] hover:underline cursor-pointer shrink-0"
                      >
                        <span>Send invite</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Privacy Footer Note */}
                  <div className="flex items-center gap-1.5 text-xs text-[#4C566A] pt-1">
                    <Lock className="w-3.5 h-3.5 text-[#4C566A] shrink-0" />
                    <span>
                      Being in a group doesn’t give anyone access to another
                      person’s bill, calls, texts or location.
                    </span>
                  </div>
                </div>

                {/* Right Column (5 cols): Sharing settings + Usage by member */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {/* Top Right Card: Sharing settings */}
                  <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col gap-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Settings className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Sharing settings
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          Each setting does one thing
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col divide-y divide-[#121B34]/8">
                      {/* Row 1: Shared data */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F6F7FA] flex items-center justify-center shrink-0">
                            <Database className="w-4 h-4 text-[#2B3A55]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0D1935] leading-5">
                              Shared data
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              Not part of your current plans
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F7FA] text-[#3B4866] text-xs font-semibold shrink-0">
                          Not available
                        </span>
                      </div>

                      {/* Row 2: Usage alerts */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F6F7FA] flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-[#2B3A55]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0D1935] leading-5">
                              Usage alerts
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              For your own numbers
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUsageAlertsModalOpen(true)}
                          className="text-xs font-semibold text-[#E01C5B] hover:underline shrink-0 cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>

                      {/* Row 3: Member data limits */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F6F7FA] flex items-center justify-center shrink-0">
                            <Gauge className="w-4 h-4 text-[#2B3A55]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0D1935] leading-5">
                              Member data limits
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              Needs a shared-data plan
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F7FA] text-[#3B4866] text-xs font-semibold shrink-0">
                          Not available
                        </span>
                      </div>

                      {/* Row 4: Pause data for a member */}
                      <div className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F6F7FA] flex items-center justify-center shrink-0">
                            <Ban className="w-4 h-4 text-[#2B3A55]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0D1935] leading-5">
                              Pause data for a member
                            </div>
                            <div className="text-xs text-[#4C566A] leading-4">
                              Needs network support we don’t have yet
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#F6F7FA] text-[#3B4866] text-xs font-semibold shrink-0">
                          Not available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Right Card: Usage by member */}
                  <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-3.5 flex-1">
                    <div className="flex flex-col gap-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <BarChart2 className="w-5 h-5 text-[#E01C5B]" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                            Usage by member
                          </h2>
                          <p className="text-xs text-[#4C566A] leading-5">
                            {billingWindowLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {visibleActiveMembers
                          .filter(
                            (m) => m.isOwnerLine || m.sharesUsageSummary
                          )
                          .map((member) => {
                            const pct =
                              member.dataTotalGb > 0
                                ? Math.min(
                                    100,
                                    Math.round(
                                      (member.dataUsedGb /
                                        member.dataTotalGb) *
                                        100
                                    )
                                  )
                                : 0;
                            return (
                              <div
                                key={member.id}
                                className="flex flex-col gap-1.5"
                              >
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-[#0D1935]">
                                    {member.memberName}
                                    {member.isOwnerLine ? " (you)" : ""} ·{" "}
                                    {member.isOwnerLine
                                      ? member.number
                                      : member.maskedNumber}
                                  </span>
                                  <span className="font-bold text-[#0D1935] shrink-0">
                                    {member.dataUsedGb} GB of{" "}
                                    {member.dataTotalGb} GB
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-[#ECEEF2] rounded-xs overflow-hidden">
                                  <div
                                    className="h-full bg-[#E01C5B] rounded-xs transition-all duration-300"
                                    style={{ width: `${Math.max(4, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-[#4C566A] pt-1">
                      <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0 mt-0.5" />
                      <span>
                        Each person’s own allowance, not a shared pool. Members
                        who share a usage summary appear here for you as bill
                        payer.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Invite someone + Family plans + Quick actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                {/* Card 1: Invite someone */}
                <div
                  ref={inviteFormRef}
                  className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-between gap-4"
                >
                  <form
                    onSubmit={handleSendInvite}
                    className="flex flex-col gap-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-[#E01C5B]" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                          Invite someone
                        </h2>
                        <p className="text-xs text-[#4C566A] leading-5">
                          They choose whether to join and what to share
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0D1935]">
                        Email or UK mobile number
                      </label>
                      <input
                        ref={inviteInputRef}
                        type="text"
                        value={inviteContact}
                        onChange={(e) => setInviteContact(e.target.value)}
                        placeholder="name@example.com or 07…"
                        className="w-full h-10 px-3 rounded-xl border border-[#121B34]/12 text-sm text-[#0D1935] placeholder:text-[#737B8C] focus:outline-none focus:border-[#E01C5B]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0D1935]">
                        Name to show in your group (optional)
                      </label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="e.g. Jordan"
                        className="w-full h-10 px-3 rounded-xl border border-[#121B34]/12 text-sm text-[#0D1935] placeholder:text-[#737B8C] focus:outline-none focus:border-[#E01C5B]"
                      />
                    </div>

                    {inviteError && (
                      <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2 text-xs text-red-700 leading-snug">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>{inviteError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingInvite}
                      className="w-full h-11 bg-[#E01C5B] hover:bg-[#c8164f] disabled:opacity-50 text-white rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold transition cursor-pointer"
                    >
                      {isSendingInvite ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending invite...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send invite</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex items-start gap-1.5 text-xs text-[#4C566A]">
                    <Info className="w-3.5 h-3.5 text-[#4C566A] shrink-0 mt-0.5" />
                    <span>
                      Adults only online. For under-18s, contact support. We
                      won’t tell you whether someone already has a Zoiko
                      account.
                    </span>
                  </div>
                </div>

                {/* Card 2: Family plans */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-start gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                        Family plans
                      </h2>
                      <p className="text-xs text-[#4C566A] leading-5">
                        Shared-data plans
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#F6F7FA] rounded-2xl flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Info className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-sm font-bold text-[#0D1935] leading-5">
                        Not available for your account yet
                      </div>
                      <p className="text-xs text-[#4C566A] leading-5">
                        We only show plans you can actually buy. We’ll let you
                        know if shared-data plans become available.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 3: Quick actions */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0px_1px_2px_0px_rgba(18,27,52,0.04),0px_2px_8px_0px_rgba(18,27,52,0.03)] border border-[#121B34]/8 flex flex-col justify-start gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-[#E01C5B]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0D1935] leading-6">
                        Quick actions
                      </h2>
                      <p className="text-xs text-[#4C566A] leading-5">
                        Shown for your role
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col divide-y divide-[#121B34]/8">
                    {/* Action 1: Invite someone */}
                    <button
                      type="button"
                      onClick={scrollToInviteForm}
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <UserPlus className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Invite someone
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Adults, by email or mobile
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>

                    {/* Action 2: Manage members */}
                    <button
                      type="button"
                      onClick={() =>
                        membersSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        })
                      }
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Manage members
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Roles, invites and removals
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>

                    {/* Action 3: Usage & allowances */}
                    <Link
                      href="/dashboard/usage-and-allowances"
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <BarChart2 className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Usage &amp; allowances
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Your own detailed usage
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </Link>

                    {/* Action 4: View the bill */}
                    <Link
                      href="/dashboard/bills-and-payments"
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            View the bill
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            For account{" "}
                            {accountSuffix ? `••${accountSuffix}` : "on file"}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </Link>

                    {/* Action 5: Get help */}
                    <button
                      type="button"
                      onClick={() => setHelpModalOpen(true)}
                      className="py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-xl transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[10px] bg-[#E01C5B]/10 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4 text-[#E01C5B]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1935] leading-5">
                            Get help
                          </div>
                          <div className="text-xs text-[#4C566A] leading-4">
                            Group questions and support
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#8E97A8] shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Edit member settings
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Customize how this member appears in your group
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0D1935]">
                  Display name in group <span className="text-[#E01C5B]">*</span>
                </label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => {
                    setEditingMember({ ...editingMember, name: e.target.value });
                    if (memberEditError) setMemberEditError("");
                  }}
                  className={`w-full h-10 px-3 rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
                    memberEditError
                      ? "border-red-400 bg-red-50/20 focus:border-red-500"
                      : "border-[#121B34]/15 focus:border-[#E01C5B]"
                  }`}
                />
                {memberEditError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{memberEditError}</span>
                  </p>
                )}
              </div>

              {!editingMember.isOwner && (
                <label className="flex items-center justify-between gap-3 p-3.5 bg-[#F6F7FA] rounded-2xl cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-[#0D1935]">
                      Share usage summary
                    </div>
                    <div className="text-xs text-[#4C566A]">
                      Show this member’s data usage progress bar in Usage by
                      member
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingMember.sharesUsageSummary}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        sharesUsageSummary: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#E01C5B]"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setMemberEditError("");
                }}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMemberEdit}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Group Modal */}
      {editHouseholdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Rename your group
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Choose a household or group name visible to members
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditHouseholdModalOpen(false);
                  setHouseholdNameError("");
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0D1935]">
                Group name <span className="text-[#E01C5B]">*</span>
              </label>
              <input
                type="text"
                value={draftHouseholdName}
                onChange={(e) => {
                  setDraftHouseholdName(e.target.value);
                  if (householdNameError) setHouseholdNameError("");
                }}
                className={`w-full h-10 px-3 rounded-xl border text-sm text-[#0D1935] focus:outline-none transition ${
                  householdNameError
                    ? "border-red-400 bg-red-50/20 focus:border-red-500"
                    : "border-[#121B34]/15 focus:border-[#E01C5B]"
                }`}
              />
              {householdNameError && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{householdNameError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditHouseholdModalOpen(false);
                  setHouseholdNameError("");
                }}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHouseholdName}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Save group name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Remove {memberToRemove.name}?
                </h3>
                <p className="text-xs text-[#4C566A]">Line: {memberToRemove.id}</p>
              </div>
            </div>
            <p className="text-xs text-[#4C566A] leading-relaxed">
              This member will be detached from your family group. They will no longer share in multi-line bill discounts or shared group data summaries.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                className="px-4 py-2 rounded-xl bg-[#D92D20] hover:bg-[#b91c1c] text-white text-xs font-semibold cursor-pointer"
              >
                Confirm remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Alerts Modal */}
      {usageAlertsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Usage alerts
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  Choose when we notify you about data usage on your numbers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUsageAlertsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-center justify-between gap-3 p-3.5 bg-[#F6F7FA] rounded-2xl cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#0D1935]">
                    80% data allowance alert
                  </div>
                  <div className="text-xs text-[#4C566A]">
                    Send SMS and email when 80% of monthly data is used
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={alertAt80Pct}
                  onChange={(e) => setAlertAt80Pct(e.target.checked)}
                  className="w-4 h-4 accent-[#E01C5B]"
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-3.5 bg-[#F6F7FA] rounded-2xl cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#0D1935]">
                    100% data allowance alert
                  </div>
                  <div className="text-xs text-[#4C566A]">
                    Notify immediately when a line reaches its monthly data
                    allowance
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={alertAt100Pct}
                  onChange={(e) => setAlertAt100Pct(e.target.checked)}
                  className="w-4 h-4 accent-[#E01C5B]"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUsageAlertsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#121B34]/15 text-xs font-semibold text-[#0D1935] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUsageAlerts}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] hover:bg-[#c8164f] text-white text-xs font-semibold cursor-pointer"
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0D1935]">
                  Family &amp; friends group help
                </h3>
                <p className="text-xs text-[#4C566A] mt-0.5">
                  How groups, privacy, and invitations work on Zoiko Mobile
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#F6F7FA] rounded-2xl flex flex-col gap-2.5 text-xs text-[#0D1935] leading-5">
              <p>
                <strong>Seats &amp; Invites:</strong> Up to 6 people can be in a
                household group. Invites sent by email or UK mobile number hold
                a seat for 7 days until accepted or cancelled.
              </p>
              <p>
                <strong>Privacy:</strong> Being in a group never gives another
                member access to your call logs, texts, location, or itemised
                bill.
              </p>
              <p>
                <strong>Under-18s:</strong> Online invitations are for adults
                (18+). To set up a line for someone under 18, please contact
                Zoiko Support on <strong>020 7164 6399</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href="/dashboard/support"
                className="text-xs font-semibold text-[#E01C5B] hover:underline"
              >
                Go to Help &amp; support →
              </Link>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#E01C5B] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
