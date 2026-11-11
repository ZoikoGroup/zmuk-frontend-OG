"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { openChat } from "./ChatbotWidget";
import {
  ChevronRight,
  Phone,
  Mail,
  Bot,
  MapPin,
  Smartphone,
  Globe,
  Radio,
  Headphones,
  Heart,
  Leaf,
  ChevronDown,
  PawPrint,
  PhoneCall,
  PhoneCallIcon,
} from "lucide-react";

// ─── SOCIAL ICONS ─────────────────────────────────────────────────────────────

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.4 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.6l-5.2-6.8L5.5 22H2.4l7.6-8.7L1.2 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.8L7.1 3.9H5.2L17.7 20z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23 7.5a3 3 0 00-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 001 7.5 31 31 0 00.5 12 31 31 0 001 16.5a3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1A31 31 0 0023.5 12 31 31 0 0023 7.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
    </svg>
  );
}

function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9h3v10zM6.5 7.7a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM19 19h-3v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.3a3 3 0 012.7-1.5c2 0 3.2 1.3 3.2 4V19z" />
    </svg>
  );
}

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PinterestIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-2.3 3.1-5 0-2.1-1.4-3.6-3.9-3.6a4.5 4.5 0 00-4.7 4.5c0 .9.3 1.5.8 2 .1.1.1.2.1.3l-.3 1.1c0 .2-.2.2-.4.1-1.1-.5-1.7-1.9-1.7-3.1 0-2.5 1.8-5.4 5.5-5.4 2.9 0 4.9 2.1 4.9 4.4 0 3-1.7 5.3-4.2 5.3-.8 0-1.6-.4-1.9-.9l-.5 2c-.2.7-.6 1.5-.9 2A10 10 0 1012 2z" />
    </svg>
  );
}

function AppleLogoIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.77 1.05-1.84.93-2.92-.93.04-2.02.63-2.66 1.39-.57.65-1.06 1.74-.93 2.78 1.03.08 2.05-.53 2.66-1.25z" />
    </svg>
  );
}

function GooglePlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.793 12 3.61 22.186a1.94 1.94 0 01-.61-.318c-.463-.38-.75-.98-.75-1.688V3.82c0-.708.287-1.308.75-1.688.18-.148.39-.257.609-.318zm11.258 11.259l2.42 2.42-11.8 6.777 9.38-9.197zm0-2.146L5.487 1.73l11.8 6.777-2.42 2.42zm1.489 1.073l3.702 2.126c.783.45.783 1.187 0 1.637l-3.702 2.126-2.222-2.222 2.222-2.167z" />
    </svg>
  );
}

// ─── NEW GLOBAL FOOTER COMPONENT ─────────────────────────────────────────────

export default function Footer() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Read login state from localStorage and listen to auth events
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("zoiko_token");
        const rawUser = localStorage.getItem("zoiko_user");
        const loggedOut = localStorage.getItem("zoiko_logged_out") === "true";
        if (!loggedOut && token && rawUser) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
    window.addEventListener("zoiko-auth", checkAuth);
    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    return () => {
      window.removeEventListener("zoiko-auth", checkAuth);
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  // Helper for dashboard links:
  // If user is logged in, open the requested dashboard page directly;
  // If user is not logged in, route to /login?next=<page> so login page opens.
  const getAuthLink = (target: string) => {
    return isLoggedIn ? target : `/login?next=${encodeURIComponent(target)}`;
  };

  // Hide on dashboard and login pages
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/")
  ) {
    return null;
  }

  return (
    <footer className="w-full bg-[#03221E] text-white overflow-hidden relative font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
        {/* ─── 1. TOP BRAND & FEATURE HIGHLIGHTS ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pb-10 border-b border-white/10">
          {/* Brand & Tagline */}
          <div className="flex flex-col items-start gap-2 max-w-sm">
            <Link href="/" >
              <Image
                src="/images/zmuk-logo.png"
                alt="Zoiko Mobile Logo"
                width={176}
                height={56}
                className="h-10 sm:h-12 w-auto object-contain "
              />
            </Link>
            <h3 className="text-white text-base font-semibold mt-2">
              The Animal &amp; Music Loving Network
            </h3>
            <p className="text-white/60 text-sm font-normal">
              Reliable connectivity. A kinder, more connected world.
            </p>
          </div>

          {/* 6 Feature Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 w-full lg:w-auto items-stretch">
            {/* 1. Great Plans */}
            <div className="flex flex-col items-center text-center gap-2 p-2 relative lg:border-r lg:border-white/20 lg:pr-6">
              <div className="w-12 h-12 flex items-center justify-center text-rose-500">
                <Smartphone className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="text-white text-sm font-normal leading-snug">
                Great Plans
              </span>
            </div>

            {/* 2. UK & Global Coverage */}
            <div className="flex flex-col items-center text-center gap-2 p-2 relative lg:border-r lg:border-white/20 lg:pr-6">
              <div className="w-12 h-12 flex items-center justify-center text-orange-400">
                <Globe className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="text-white text-sm font-normal leading-snug">
                UK &amp; Global Coverage
              </span>
            </div>

            {/* 3. eSIM Ready */}
            <div className="flex flex-col items-center text-center gap-2 p-2 relative lg:border-r lg:border-white/20 lg:pr-6">
              <div className="w-12 h-12 flex items-center justify-center text-rose-500">
                <PhoneCallIcon className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="text-white text-sm font-normal leading-snug">
                eSIM Ready
              </span>
            </div>

            {/* 4. Music Perks */}
            <div className="flex flex-col items-center text-center gap-2 p-2 relative lg:border-r lg:border-white/20 lg:pr-6">
              <div className="w-12 h-12 flex items-center justify-center text-orange-400">
                <Headphones className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="text-white text-sm font-normal leading-snug">
                Music Perks
              </span>
            </div>

            {/* 5. Supporting Animals */}
            <div className="flex flex-col items-center text-center gap-2 p-2 relative lg:border-r lg:border-white/20 lg:pr-6">
              <div className="w-12 h-12 flex items-center justify-center text-rose-500">
                <PawPrint className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="text-white text-sm font-normal leading-snug">
                Supporting Animals
              </span>
            </div>

            {/* 6. A More Sustainable Future */}
            <div className="flex flex-col items-center text-center gap-2 p-2">
              <div className="w-12 h-12 flex items-center justify-center text-orange-400">
                <Leaf className="w-8 h-8 stroke-[2]" />
              </div>
              <span className="text-white text-sm font-normal leading-snug">
                A More Sustainable Future
              </span>
            </div>
          </div>
        </div>

        {/* ─── 2. FOUR NAVIGATION COLUMNS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-b border-white/10">
          {/* Column 1: Plans & Services */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-white text-base font-medium">Plans &amp; Services</h4>
              <div className="w-10 h-0.5 bg-rose-600 rounded-full" />
            </div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/plans" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>SIM-only plans</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li> 
              <li>
                <Link href="/30-day-plan" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>30-day plans</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/business-deals_sim-only-plans" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Business SIMs</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/data-only-plans" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Data only SIMs</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/plans" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>eSIM</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/roaming-and-coverage" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Roaming &amp; international</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <a href="https://ee.co.uk/help/mobile-coverage-checker" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Coverage checker</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </a>
              </li>
              <li>
                <Link href="/switch-and-save" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Switch to Zoiko Mobile</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Your account */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-white text-base font-medium">Your account</h4>
              <div className="w-10 h-0.5 bg-orange-400 rounded-full" />
            </div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href={isLoggedIn ? "/dashboard" : "/login?next=/dashboard"} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>{isLoggedIn ? "My Dashboard" : "Sign in"}</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/activate-your-sim" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Activate your SIM</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/my-mobile-numbers")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Manage your numbers</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/addons-and-boosters")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Top up</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/usage-and-allowances")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Usage &amp; allowances</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/sim-and-esim/replace")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Replace your SIM</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/bills-and-payments")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Bills &amp; payments</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Account help</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help & support */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-white text-base font-medium">Help &amp; support</h4>
              <div className="w-10 h-0.5 bg-rose-600 rounded-full" />
            </div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => openChat()}
                  className="group w-full flex items-center justify-between text-left text-white/70 hover:text-white text-sm transition-colors cursor-pointer"
                >
                  <span>Zovie - Virtual Assistant</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </button>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/support")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Help center</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/rates-and-charges")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Roaming &amp; rates</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/orders")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Order tracking</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/sim-and-esim/replace")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Lost or stolen SIM</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Complaints</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/vulnerability-policy" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Accessibility</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Contact us</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: About Zoiko */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-white text-base font-medium">About Zoiko</h4>
              <div className="w-10 h-0.5 bg-orange-400 rounded-full" />
            </div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/about-us" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Our Story</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/animals-and-music" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Animals &amp; music</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/app/animals-and-music" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>News &amp; stories</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href={getAuthLink("/dashboard/refer-and-earn")} className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Refer a friend</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <a href="https://zoikoorbit.com/" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Zoiko Orbit</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </a>
              </li>
              <li>
                <a href="https://zoikobroadband.com/" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Zoiko Broadband</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </a>
              </li>
              <li>
                <Link href="/about-us" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Careers</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
              <li>
                <Link href="/esg-policy" className="group flex items-center justify-between text-white/70 hover:text-white text-sm transition-colors">
                  <span>Sustainability</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── 3. ARTWORK & CONTACT / SUPPORT ROW ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-10 items-center border-b border-white/10">
          {/* Left: Illustration artwork */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[432px] aspect-[432/286] rounded-2xl overflow-hidden">
              <Image
                src="/images/new home and header/footer (2).png"
                alt="Good Connections Do Good - Zoiko Mobile"
                fill
                sizes="(max-width: 768px) 100vw, 432px"
                className="object-contain"
                priority={false}
              />
            </div>
          </div>

          {/* Center: Need help? Contact information */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:border-l lg:border-white/10 lg:pl-8">
            <div>
              <h4 className="text-white text-base font-medium">Need help?</h4>
              <p className="text-white/80 text-xs">Our UK team is here for you.</p>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-rose-500 mt-0.5">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <a href="tel:02071646399" className="text-white text-sm font-medium hover:underline">
                  020 7164 6399
                </a>
                <span className="text-white/80 text-xs">
                  Mon-Fri 8am-8pm, Sat 9am-5pm ( UK time )
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-rose-500">
                <Mail className="w-5 h-5" />
              </div>
              <a href="mailto:info@zoikomobile.co.uk" className="text-white text-sm font-medium hover:underline">
                info@zoikomobile.co.uk
              </a>
            </div>

            {/* Virtual Assistant */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-rose-500 mt-0.5">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => openChat()}
                  className="text-white text-sm font-medium hover:underline text-left cursor-pointer"
                >
                  Chat with Zovie
                </button>
                <span className="text-white/80 text-xs">
                  Get instant help 24/7
                </span>
              </div>
            </div>
          </div>

          {/* Right: Social icons, App Store buttons, and Chat with Zovie CTA */}
          <div className="lg:col-span-4 flex flex-col gap-5 lg:border-l lg:border-white/10 lg:pl-8">
            {/* Social Circle Icons */}
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://www.instagram.com/zoikomobileuk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/zoikomobileUK"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/zoikomobileUK"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com/@ZoikoMobileUK"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <YouTubeIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/zoiko-mobile-uk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
              <a
                href="https://uk.pinterest.com/zoikomobileuk/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <PinterestIcon className="w-4 h-4" />
              </a>
            </div>

            {/* App Store / Google Play Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Google Play */}
              <a
                href="#"
                className="inline-flex items-center gap-2.5 bg-black hover:bg-neutral-900 border border-white/20 px-3.5 py-1.5 rounded-xl transition-colors"
              >
                <GooglePlayIcon className="w-5 h-5 text-white" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-white/80 leading-tight">Get it on</span>
                  <span className="text-xs font-medium text-white leading-tight">Google Play</span>
                </div>
              </a>

              {/* App Store */}
              <a
                href="#"
                className="inline-flex items-center gap-2.5 bg-black hover:bg-neutral-900 border border-white/20 px-3.5 py-1.5 rounded-xl transition-colors"
              >
                <AppleLogoIcon className="w-5 h-5 text-white" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-white/80 leading-tight">Download on the</span>
                  <span className="text-xs font-medium text-white leading-tight">App Store</span>
                </div>
              </a>
            </div>

            {/* Chat with Zovie Pill Button */}
            <button
              type="button"
              onClick={() => openChat()}
              className="w-full sm:w-64 h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg shadow-rose-600/30 px-5 flex items-center justify-between transition-all group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-medium">Chat with Zovie</span>
              <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ─── 4. REGISTERED OFFICE, POLICIES & COPYRIGHT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-8 items-start lg:items-center text-xs">
          {/* Registered Office (UK) */}
          <div className="lg:col-span-4 flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center text-orange-400 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">Registered office (UK)</span>
              <span className="text-white/80 text-xs leading-relaxed">
                167-169 Great Portland Street, 5th Floor, <br />
                London W1W 5PF
              </span>
            </div>
          </div>

          {/* Legal Policies Grid */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {/* Row 1 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/80">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                Terms and Conditions
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">
                Cookies
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/vulnerability-policy" className="hover:text-white transition-colors">
                Accessibility
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/vulnerability-policy" className="hover:text-white transition-colors">
                Vulnerability Policy
              </Link>
            </div>

            {/* Row 2 */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/80">
              <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                Complaints Code
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                Ofcom &amp; ADR
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/esg-policy" className="hover:text-white transition-colors">
                ESG Policy
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/modern-slavery-policy" className="hover:text-white transition-colors">
                Modern Slavery Policy
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/plans" className="hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
          </div>

          {/* Country Selector & Copyright */}
          <div className="lg:col-span-3 flex flex-col items-start lg:items-end gap-2">
            {/* UK Flag Badge */}
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-xl px-3 py-1 bg-white/5">
              <span className="text-sm">🇬🇧</span>
              <span className="text-xs font-medium text-white">UK</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            </div>

            <p className="text-white/80 text-xs">
              &copy; 2026 Zoiko Mobile UK. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── PREVIOUS FOOTER IMPLEMENTATION (PRESERVED AS COMMENT) ───────────────────
const linkColumns = [
  {
    title: "Zoiko Mobile UK",
    links: [
      { label: "Zoiko Mobile Plans", href: "/plans" },
      { label: "Business SIM Deals", href: "/business-deals_sim-only-plans" },
      { label: "Data Only SIMs", href: "/data-only-plans" },
      { label: "30-Day Plans", href: "/30-day-plan" },
      { label: "Coverage Checker", href: "https://ee.co.uk/help/mobile-coverage-checker" },
      { label: "Zoiko Broadband", href: "https://zoikobroadband.com/" },
      { label: "Zoiko Orbit", href: "https://zoikoorbit.com/" },
    ],
  },
  {
    title: "Zoiko Rates",
    links: [
      { label: "Roaming and Overage", href: "/roaming-and-coverage" },
      { label: "Zero Cost SMS", href: "/zero-cost-sms" },
      { label: "Discounted Rates", href: "/discounted-rates" },
      { label: "Refer A Friend", href: "/refer-a-friend" },
    ],
  },
  {
    title: "About Zoiko",
    links: [
      { label: "Blogs", href: "/blogs" },
      { label: "News", href: "/news" },
      { label: "FAQs", href: "/faqs" },
      { label: "Contact Us", href: "/contact-us" },
    ],
  },
  {
    title: "Zoiko Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Vulnerability Policy", href: "/vulnerability-policy" },
      { label: "Modern Slavery Policy", href: "/modern-slavery-policy" },
      { label: "ESG Policy", href: "/esg-policy" },
    ],
  },
];

const storeButtons = [
  { label: "Google Play", img: "/images/apple.png", href: "" },
  { label: "App Store", img: "/images/play.png", href: "" },
];

const offices = [
  {
    city: "Head Office",
    address: "167-169 Great Portland Street, 5th Floor, London W1W 5PF",
    phone: "+44 020 7164 6399",
    email: "info@zoikomobile.co.uk",
  },
  {
    city: "Glasgow",
    address: "Suite 2/3, 48 West George Street, Glasgow G2 1BP",
    phone: "+44 020 7164 6399",
    email: "info@zoikomobile.co.uk",
  },
  {
    city: "Cardiff",
    address: "Portland House, 113-116 Blue Street, Cardiff CF10 5EQ",
    phone: "+44 020 7164 6399",
    email: "info@zoikomobile.co.uk",
  },
];
────────────────────────────────────────────────────────────────────────────── */
