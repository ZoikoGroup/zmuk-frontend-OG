"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Search, ShoppingCart, LayoutDashboard, LogOut } from "lucide-react";
import { useCart } from "../context/CartContext";

// Top utility bar links
const topLinks = [
  { label: "Activate Your SIM", href: "/activate-your-sim", highlight: true },
  { label: "Top Up", href: "/recharge" },
  { label: "Switch & Save", href: "/switch-and-save" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Support", href: "/support" },
  { label: "International Calls", href: "/international-calling" },
];

// A dropdown can be either a flat list of links, or grouped sections.
type DropItem = { label: string; href: string };
type DropGroup = { heading?: string; items: DropItem[] };

type NavItem = {
  label: string;
  href: string;
  groups?: DropGroup[]; // grouped mega-dropdown
};

// Main nav. "Zoiko Plans" uses the grouped dropdown matching the live site.
const navLinks: NavItem[] = [
  {
    label: "Zoiko Plans",
    href: "/plans",
    groups: [
      { items: [{ label: "All Plans", href: "/plans" }] },
      {
        heading: "For You",
        items: [
          { label: "Student Plans", href: "/student-deals" },
          { label: "Essential Worker Plans", href: "/civilservants" },
          { label: "Social Tariff Plans", href: "/social-tariff-plans" },
        ],
      },
      {
        heading: "Usage & Flexibility",
        items: [
          { label: "Data-Only Plans", href: "/data-only-plans" },
          { label: "Flexible 30-Day Plans", href: "/30-day-plan" },
        ],
      },
    ],
  },
  { label: "Business Deals", href: "/business-deals_sim-only-plans" },
  { label: "Devices", href: "/devices" },
  { label: "Animals & Music", href: "/animals-and-music" },
  { label: "About Us", href: "/about-us" },
];

export default function Header() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { totalItems } = useCart();

  // Read auth state from localStorage on mount + keep it in sync
  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem("zoiko_token"));
    check();
    // "zoiko-auth" -> fired by the login page after a successful login (same tab)
    // "storage"    -> fired when another tab logs in/out
    // "focus"      -> re-check when the window regains focus
    window.addEventListener("zoiko-auth", check);
    window.addEventListener("storage", check);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("zoiko-auth", check);
      window.removeEventListener("storage", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("zoiko_token");
    localStorage.removeItem("zoiko_user");
    setIsLoggedIn(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800">
      {/* ─── Top utility bar (desktop only) ─── */}
      <div className="hidden lg:block">
        <div className="mx-auto flex max-w-7xl justify-end gap-6 px-4 py-2 sm:px-6 md:px-8">
          {topLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`text-sm transition-colors hover:text-[#0e8f74] ${l.highlight
                  ? "font-bold text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400"
                }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Main bar ─── */}
      <div className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8">
          {/* Logo — image slot */}
          <Link href="/" className="flex flex-shrink-0 items-center">
            <span className="relative block h-15 w-[180px] sm:w-[220px]">
              <Image src="/images/logo.png" alt="Zoiko Mobile" fill priority sizes="220px" className="object-contain object-left" />
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((item) =>
              item.groups ? (
                <div key={item.label} className="group relative">
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors hover:text-[#e6007e] dark:text-gray-200"
                  >
                    {item.label}
                    <ChevronDown size={15} className="transition-transform group-hover:rotate-180" />
                  </Link>
                  {/* pt-3 keeps a hover bridge between the link and the menu */}
                  <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                    <div className="w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      {item.groups.map((group, gi) => (
                        <div key={gi} className={gi > 0 ? "mt-1 border-t border-gray-100 pt-1 dark:border-gray-700" : ""}>
                          {group.heading && (
                            <p className="px-5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                              {group.heading}
                            </p>
                          )}
                          {group.items.map((d) => (
                            <Link
                              key={d.label}
                              href={d.href}
                              className="block px-5 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#e6007e] dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              {d.label}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-[#e6007e] dark:text-gray-200"
                >
                  {item.label}
                </Link>
              )
            )}

            {/* Dashboard link (only when logged in) */}
            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-[#e6007e] dark:text-gray-200"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right: search, cart, login/logout, hamburger */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Search size={20} />
            </button>

            {/* Cart icon */}
            {/* <Link
              href="/cart"
              aria-label="Cart"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <ShoppingCart size={20} />
            </Link> */}

            <Link
              href="/checkout"
              aria-label="Cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition-colors dark:text-gray-200"
            >
              <ShoppingCart size={20} />

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-full border border-[#e6007e] px-5 py-2.5 text-sm font-semibold text-[#e6007e] transition-colors hover:bg-[#e6007e] hover:text-white sm:inline-flex"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-block"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden dark:text-gray-200 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile menu ─── */}
      {mobileOpen && (
        <nav className="border-b border-gray-100 bg-white lg:hidden dark:border-gray-800 dark:bg-gray-800">
          {/* Main nav links */}
          {navLinks.map((item) =>
            item.groups ? (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  aria-expanded={openDropdown === item.label}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:active:bg-gray-800"
                >
                  {item.label}
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform dark:text-gray-400 ${openDropdown === item.label ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === item.label && (
                  <div className="bg-gray-50 dark:bg-gray-800">
                    {item.groups.map((group, gi) => (
                      <div key={gi}>
                        {group.heading && (
                          <p className="px-6 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {group.heading}
                          </p>
                        )}
                        {group.items.map((d) => (
                          <Link
                            key={d.label}
                            href={d.href}
                            onClick={() => setMobileOpen(false)}
                            className="block border-b border-gray-100 py-3 pl-8 pr-5 text-sm text-gray-600 last:border-0 active:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:active:bg-gray-700"
                          >
                            {d.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:active:bg-gray-800"
              >
                {item.label}
              </Link>
            )
          )}

          {/* Dashboard (only when logged in) */}
          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5 text-sm font-medium text-gray-700 active:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:active:bg-gray-800"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}

          {/* Top utility links (shown here on mobile since the top bar is desktop-only) */}
          <div className="bg-gray-50 dark:bg-gray-800">
            {topLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`block border-b border-gray-100 px-5 py-3 text-sm last:border-0 active:bg-gray-100 dark:border-gray-700 dark:active:bg-gray-700 ${l.highlight
                    ? "font-bold text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300"
                  }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Login / Logout */}
          <div className="px-5 py-4">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#e6007e] py-3 text-center text-sm font-semibold text-[#e6007e] transition-colors hover:bg-[#e6007e] hover:text-white"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block rounded-full bg-gradient-to-r from-[#17a06a] to-[#0e8f74] py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}