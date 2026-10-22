"use client";

import React, { useEffect, useState, useMemo } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardTopNav from "../components/DashboardTopNav";
import beQuick from "../../utils/dasdbeQuickApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ---------- Types ----------
interface Order {
  id?: string | number;
  order_id?: string | number;
  date?: string;
  created_at?: string;
  description?: string;
  amount?: string | number;
  total?: string | number;
  status?: string;
}

// ---------- Component ----------
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topSearchQuery, setTopSearchQuery] = useState("");
  const [userName, setUserName] = useState("Customer");

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  // ---------- Fetch Orders ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("zoiko_token") ||
          localStorage.getItem("driverx_token") ||
          "";
        const rawUser =
          localStorage.getItem("zoiko_user") ||
          localStorage.getItem("driverx_user") ||
          "{}";
        let userData: any = {};
        try {
          userData = JSON.parse(rawUser);
        } catch {}

        const email: string = userData?.email || "";
        const fullName =
          [userData?.first_name, userData?.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          userData?.name ||
          (email ? email.split("@")[0] : "Customer");
        setUserName(fullName);

        const combinedOrders: Order[] = [];

        // 1. Fetch from Django bqorders
        if (email && token) {
          try {
            const res = await fetch(`${API_BASE}/api/v1/bqorders/by-user/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
              },
              body: JSON.stringify({ logged_user: email }),
            });
            if (res.ok) {
              const data = await res.json();
              const groups = data?.groups?.[email] || {};
              Object.entries(groups).forEach(([ordId, entries]: [string, any]) => {
                const entry = entries?.[0];
                if (entry) {
                  combinedOrders.push({
                    id: entry.order_db_id || ordId,
                    created_at: entry.created_at
                      ? new Date(entry.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent",
                    description: entry.plan_name || "Zoiko Mobile Plan Order",
                    total: entry.total || 0,
                    status: entry.status || "completed",
                  });
                }
              });
            }
          } catch {}
        }

        // 2. Also check BeQuick subscriber orders if available
        if (email && combinedOrders.length === 0) {
          try {
            const subscriberResult = (await beQuick.getSubscriberByEmail(
              email
            )) as { subscriber_id?: number } | false;
            if (subscriberResult && subscriberResult.subscriber_id) {
              const ord = (await beQuick.getOrders(
                subscriberResult.subscriber_id
              )) as { orders?: Order[]; data?: Order[] };
              const list = ord?.orders || ord?.data || [];
              combinedOrders.push(...list);
            }
          } catch {}
        }

        setOrders(combinedOrders);
      } catch (err) {
        console.error("Orders fetch error:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Filter + Search ----------
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        (order.id || order.order_id || "").toString().includes(search) ||
        (order.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (order.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // ---------- Pagination ----------
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-[#EDEEF2] text-[#0D1935] font-sans p-3 sm:p-5">
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">
        {/* Responsive Sidebar */}
        <div className="w-full lg:w-auto lg:sticky lg:top-5 shrink-0 z-30">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          <DashboardTopNav
            userName={userName}
            searchQuery={topSearchQuery}
            setSearchQuery={setTopSearchQuery}
            isDemo={false}
            hideDemoBadgeInHeader={true}
            customTitle="My orders"
            customSubtitle="View all your Zoiko Mobile orders, transactions, and plan purchases in one place."
          />

          <div className="bg-white rounded-[22px] p-4 sm:p-6 shadow-[0px_2px_8px_0px_rgba(18,27,52,0.03),0px_1px_2px_0px_rgba(18,27,52,0.04)] border border-slate-100 flex flex-col gap-5">
            {/* Title & Total */}
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h4 className="text-base sm:text-lg font-bold text-[#0D1935]">
                All Orders
              </h4>
              <span className="text-xs font-semibold text-[#667085] bg-[#F8F9FB] px-3 py-1 rounded-full border border-[#E4E7EC]">
                Total: {filteredOrders.length} orders
              </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Search orders by ID or description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-[#E4E7EC] bg-[#F8F9FB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B] focus:bg-white transition"
                />
              </div>
              <div className="sm:max-w-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-[#E4E7EC] bg-[#F8F9FB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0D1935] focus:outline-none focus:border-[#E01C5B] focus:bg-white transition"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-10">
                <div
                  className="w-8 h-8 border-4 border-[#E01C5B] border-t-transparent rounded-full animate-spin"
                  role="status"
                >
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Empty */}
            {!loading && !error && filteredOrders.length === 0 && (
              <div className="text-center py-10 bg-[#F8F9FB] rounded-2xl border border-[#EAECF0]">
                <h5 className="font-bold text-sm text-[#0D1935]">
                  No Orders Found
                </h5>
                <p className="text-xs text-[#667085] mt-1">
                  Your completed SIM and plan orders will appear here.
                </p>
              </div>
            )}

            {/* Orders Grid */}
            {paginatedOrders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedOrders.map((order, i) => {
                  const status = (order.status || "completed").toLowerCase();
                  const badgeClass =
                    status === "completed"
                      ? "bg-[#ECFDF3] text-[#027A48]"
                      : status === "processing"
                      ? "bg-sky-50 text-sky-700"
                      : status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : status === "failed"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-100 text-slate-700";

                  return (
                    <div
                      className="bg-white rounded-2xl border border-[#EAECF0] p-4 sm:p-5 flex flex-col justify-between gap-3 hover:border-[#D0D5DD] transition"
                      key={i}
                    >
                      <div>
                        <div className="flex justify-between items-center gap-2 mb-1.5">
                          <h6 className="font-bold text-sm text-[#0D1935]">
                            Order #{order.id || order.order_id}
                          </h6>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${badgeClass}`}
                          >
                            {status}
                          </span>
                        </div>

                        <small className="text-xs text-[#667085] block mb-2">
                          {order.date || order.created_at || "-"}
                        </small>

                        <p className="text-xs text-[#344054]">
                          {order.description || "Plan Purchase"}
                        </p>
                      </div>

                      <h5 className="text-base font-extrabold text-[#E01C5B] pt-2 border-t border-[#F2F4F7]">
                        £{Number(order.amount || order.total || 0).toFixed(2)}
                      </h5>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-2 gap-2 flex-wrap">
                <button
                  className="px-3 py-1.5 border border-[#E4E7EC] text-[#0D1935] text-xs font-bold rounded-xl hover:bg-[#F8F9FB] transition disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ← Prev
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                      currentPage === i + 1
                        ? "bg-[#E01C5B] text-white"
                        : "border border-[#E4E7EC] text-[#0D1935] hover:bg-[#F8F9FB]"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  className="px-3 py-1.5 border border-[#E4E7EC] text-[#0D1935] text-xs font-bold rounded-xl hover:bg-[#F8F9FB] transition disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * OLD CODE (previous version, kept for reference — not used)
 * ============================================================================

"use client";

import { useEffect, useState, useMemo } from "react";
import beQuick from "../../utils/dasdbeQuickApi";

// ---------- Types ----------
interface Order {
  id?: string | number;
  order_id?: string | number;
  date?: string;
  created_at?: string;
  description?: string;
  amount?: string | number;
  total?: string | number;
  status?: string;
}

// ---------- Component ----------
export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  // ---------- Fetch Orders ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const userData = JSON.parse(localStorage.getItem("driverx_user") || "{}");
        const userEmail: string = "info@golitemobile.com";

        if (!userEmail) {
          setError("User not found");
          return;
        }

        const subscriberResult = await beQuick.getSubscriberByEmail(userEmail) as { subscriber_id: number } | false;

        if (!subscriberResult || !subscriberResult.subscriber_id) {
          setError("Subscriber not found");
          return;
        }

        const SUBSCRIBER_ID = subscriberResult.subscriber_id;

        const ord = await beQuick.getOrders(SUBSCRIBER_ID) as { orders?: Order[]; data?: Order[] };
        setOrders(ord?.orders || ord?.data || []);
      } catch (err) {
        console.error("Orders fetch error:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Filter + Search ----------
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        (order.id || order.order_id || "").toString().includes(search) ||
        (order.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (order.status || "").toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // ---------- Pagination ----------
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ---------- Render ----------
  return (
    <div className="flex flex-col min-h-screen">
      <main className="grow dark:bg-gray-900 dark:text-white bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Title *\/}
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold mb-0">All Orders</h4>
            <span className="text-gray-400 text-sm">
              Total: {filteredOrders.length} orders
            </span>
          </div>

          {/* Filters *\/}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="🔍 Search orders..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="md:max-w-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading *\/}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {/* Error *\/}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Empty *\/}
          {!loading && !error && filteredOrders.length === 0 && (
            <div className="text-center py-10">
              <h5 className="font-semibold">No Orders Found</h5>
              <p className="text-gray-400">Try changing filters or search</p>
            </div>
          )}

          {/* Orders Grid *\/}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedOrders.map((order, i) => {
              const status = (order.status || "").toLowerCase();
              const badgeClass =
                status === "completed" ? "bg-green-600 text-white" :
                status === "processing" ? "bg-sky-400 text-gray-800" :
                status === "pending" ? "bg-yellow-400 text-gray-800" :
                status === "failed" ? "bg-red-600 text-white" :
                "bg-gray-400 text-white";

              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 flex flex-col" key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <h6 className="font-bold mb-0">
                      Order #{order.id || order.order_id}
                    </h6>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                      {status || "unknown"}
                    </span>
                  </div>

                  <small className="text-gray-400 mb-2 block">
                    {order.date || order.created_at || "-"}
                  </small>

                  <p className="text-gray-500 grow mb-3">
                    {order.description || "Plan Purchase"}
                  </p>

                  <h5 className="text-green-600 font-bold mb-0">
                    ${Number(order.amount || order.total || 0).toFixed(2)}
                  </h5>
                </div>
              );
            })}
          </div>

          {/* Pagination *\/}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2 flex-wrap">
              <button
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ← Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentPage === i + 1
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
*/
