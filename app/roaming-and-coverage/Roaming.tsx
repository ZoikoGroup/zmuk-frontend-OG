"use client";

import { useState, useMemo } from "react";
import { Search, Globe, Phone, MessageSquare, Database, Check, ShieldCheck } from "lucide-react";

// ─── DATA & ZONE RATES ────────────────────────────────────────────────────────

export interface ZoneRates {
  zone: string;
  zoneName: string;
  isEuIncluded: boolean;
  countries: string;
  textSent: string;
  textReceived: string;
  callSent: string;
  callReceived: string;
  dataPriceMb: string;
}

export const ZONES_DATA: ZoneRates[] = [
  {
    zone: "Zone 1",
    zoneName: "Zone 1 (UK Offshore & Ireland)",
    isEuIncluded: true,
    countries: "Ireland, Isle of Man, Guernsey, Jersey",
    textSent: "£0.08",
    textReceived: "£0.00",
    callSent: "£0.013",
    callReceived: "£0.036",
    dataPriceMb: "£0.0040",
  },
  {
    zone: "Zone 2",
    zoneName: "Zone 2 (EU & EEA + Wider Europe)",
    isEuIncluded: true,
    countries: "Austria, Belgium, Bulgaria, Croatia, Cyprus, Czech Republic, Denmark, Estonia, Finland, France, Germany, Gibraltar, Greece, Hungary, Iceland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Monaco, Netherlands, Norway, Poland, Portugal, Romania, San Marino, Slovakia, Slovenia, Spain, Sweden, Switzerland, Turkey, Vatican City, Albania, Andorra, Bosnia & Herzegovina, North Macedonia, Serbia",
    textSent: "£0.10",
    textReceived: "£0.00",
    callSent: "£0.065",
    callReceived: "£0.052",
    dataPriceMb: "£0.0160",
  },
  {
    zone: "Zone 3",
    zoneName: "Zone 3 (Asia Pacific & Subcontinent)",
    isEuIncluded: false,
    countries: "Australia, China, Hong Kong, India, New Zealand, Philippines, Singapore, South Korea",
    textSent: "£0.16",
    textReceived: "£0.00",
    callSent: "£0.065",
    callReceived: "£0.033",
    dataPriceMb: "£0.0320",
  },
  {
    zone: "Zone 4",
    zoneName: "Zone 4 (North America)",
    isEuIncluded: false,
    countries: "USA (United States), Canada",
    textSent: "£0.35",
    textReceived: "£0.00",
    callSent: "£0.065",
    callReceived: "£0.390",
    dataPriceMb: "£0.0800",
  },
  {
    zone: "Zone 5",
    zoneName: "Zone 5 (Middle East & North Africa)",
    isEuIncluded: false,
    countries: "Algeria, Egypt, Israel, Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Qatar, Saudi Arabia, Syria, Tunisia, United Arab Emirates (Dubai)",
    textSent: "£0.70",
    textReceived: "£0.00",
    callSent: "£0.520",
    callReceived: "£1.170",
    dataPriceMb: "£1.0900",
  },
  {
    zone: "Zone 6",
    zoneName: "Zone 6 (Rest of the World)",
    isEuIncluded: false,
    countries: "Afghanistan, Argentina, Brazil, Chile, Colombia, Costa Rica, Ghana, Indonesia, Jamaica, Japan, Kenya, Malaysia, Mexico, Nigeria, Pakistan, Peru, South Africa, Sri Lanka, Thailand, Vietnam & all other worldwide destinations",
    textSent: "£0.70",
    textReceived: "£0.00",
    callSent: "£0.830",
    callReceived: "£1.170",
    dataPriceMb: "£3.1250",
  },
];

// Popular individual destination lookup list
const POPULAR_COUNTRIES = [
  { name: "United States", code: "US", zone: "Zone 4", flag: "🇺🇸" },
  { name: "Spain", code: "ES", zone: "Zone 2", flag: "🇪🇸" },
  { name: "France", code: "FR", zone: "Zone 2", flag: "🇫🇷" },
  { name: "India", code: "IN", zone: "Zone 3", flag: "🇮🇳" },
  { name: "Ireland", code: "IE", zone: "Zone 1", flag: "🇮🇪" },
  { name: "Türkiye (Turkey)", code: "TR", zone: "Zone 2", flag: "🇹🇷" },
  { name: "United Arab Emirates (Dubai)", code: "AE", zone: "Zone 5", flag: "🇦🇪" },
  { name: "Australia", code: "AU", zone: "Zone 3", flag: "🇦🇺" },
  { name: "Canada", code: "CA", zone: "Zone 4", flag: "🇨🇦" },
  { name: "Germany", code: "DE", zone: "Zone 2", flag: "🇩🇪" },
  { name: "Italy", code: "IT", zone: "Zone 2", flag: "🇮🇹" },
  { name: "Greece", code: "GR", zone: "Zone 2", flag: "🇬🇷" },
  { name: "Portugal", code: "PT", zone: "Zone 2", flag: "🇵🇹" },
  { name: "Saudi Arabia", code: "SA", zone: "Zone 5", flag: "🇸🇦" },
  { name: "Pakistan", code: "PK", zone: "Zone 6", flag: "🇵🇰" },
  { name: "South Africa", code: "ZA", zone: "Zone 6", flag: "🇿🇦" },
  { name: "China", code: "CN", zone: "Zone 3", flag: "🇨🇳" },
  { name: "Japan", code: "JP", zone: "Zone 6", flag: "🇯🇵" },
  { name: "Thailand", code: "TH", zone: "Zone 6", flag: "🇹🇭" },
  { name: "Brazil", code: "BR", zone: "Zone 6", flag: "🇧🇷" },
  { name: "New Zealand", code: "NZ", zone: "Zone 3", flag: "🇳🇿" },
  { name: "Egypt", code: "EG", zone: "Zone 5", flag: "🇪🇬" },
  { name: "Morocco", code: "MA", zone: "Zone 5", flag: "🇲🇦" },
  { name: "Singapore", code: "SG", zone: "Zone 3", flag: "🇸🇬" },
  { name: "Switzerland", code: "CH", zone: "Zone 2", flag: "🇨🇭" },
  { name: "Netherlands", code: "NL", zone: "Zone 2", flag: "🇳🇱" },
  { name: "Poland", code: "PL", zone: "Zone 2", flag: "🇵🇱" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const pillColor: Record<string, string> = {
  text: "bg-[#6d5dd3]",
  calls: "bg-[#e6007e]",
  data: "bg-[#ec4faa]",
};

function Pill({ label, color }: { label: string; color: keyof typeof pillColor }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white ${pillColor[color]}`}>
      {label}
    </span>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">{children}</table>
      </div>
    </div>
  );
}

// ─── PAGE COMPONENT ──────────────────────────────────────────────────────────

export default function Roaming() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("Zone 2");

  // Search filter across countries and zones
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    // Search popular list
    const matchedCountries = POPULAR_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );

    // Search zone countries
    const matchedZones = ZONES_DATA.filter(
      (z) => z.zone.toLowerCase().includes(q) || z.countries.toLowerCase().includes(q)
    );

    return {
      countries: matchedCountries,
      zones: matchedZones,
    };
  }, [searchQuery]);

  const activeZoneDetails = useMemo(() => {
    return ZONES_DATA.find((z) => z.zone === selectedZone) || ZONES_DATA[1];
  }, [selectedZone]);

  return (
    <main className="bg-gray-50 font-sans dark:bg-gray-900 pb-16">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-14 text-center text-white sm:px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Globe className="w-3.5 h-3.5" />
            Official Roaming Tariffs &amp; Country Rates
          </span>
          <h1 className="font-extrabold text-[clamp(1.8rem,4.5vw,2.75rem)] tracking-tight">
            Zoiko Roaming Zone Charges &amp; Country Rates
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/90 max-w-2xl mx-auto">
            Check transparent out-of-bundle roaming costs for calls, texts, and data across all global zones and destinations.
          </p>

          {/* Country Search Bar in Hero */}
          <div className="mt-8 max-w-xl mx-auto relative text-left">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any country (e.g. USA, Spain, India, France, UAE)..."
                className="w-full bg-white text-gray-900 pl-11 pr-4 py-3.5 rounded-2xl shadow-lg border-0 text-sm focus:ring-2 focus:ring-white placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap text-xs text-white/80">
              <span className="font-medium">Popular:</span>
              {["Spain", "United States", "France", "India", "Ireland", "Türkiye"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSearchQuery(c)}
                  className="px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 transition cursor-pointer"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 md:px-8">
        {/* ─── Search Results Box (When Query Active) ─── */}
        {searchResults && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0e8f74]" />
                <span>Search Results for &ldquo;{searchQuery}&rdquo;</span>
              </h2>
              <span className="text-xs text-gray-500">
                Found {searchResults.countries.length + searchResults.zones.length} matching entries
              </span>
            </div>

            {/* Matched Countries Cards */}
            {searchResults.countries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {searchResults.countries.map((c) => {
                  const zData = ZONES_DATA.find((z) => z.zone === c.zone) || ZONES_DATA[1];
                  return (
                    <div
                      key={c.name}
                      onClick={() => setSelectedZone(c.zone)}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 hover:border-[#0e8f74] transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{c.flag}</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0e8f74] border border-emerald-200">
                          {c.zone}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-1 text-[11px] text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div>
                          <div className="text-gray-400">Data</div>
                          <div className="font-bold text-[#0e8f74]">{zData.dataPriceMb}/MB</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Calls Sent</div>
                          <div className="font-bold text-gray-800 dark:text-gray-200">{zData.callSent}/min</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Texts Sent</div>
                          <div className="font-bold text-gray-800 dark:text-gray-200">{zData.textSent}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Matched Zones */}
            {searchResults.zones.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Matching Zones</div>
                {searchResults.zones.map((z) => (
                  <div key={z.zone} className="p-3 rounded-xl bg-slate-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200">
                    <span className="font-bold text-[#0e8f74]">{z.zoneName}:</span> {z.countries}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Interactive Zone Inspector Card ─── */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Select a Zone to Inspect Countries &amp; Costs</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Click any zone button below to view all included countries and out-of-bundle rates</p>
            </div>
            {activeZoneDetails.isEuIncluded && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                EU Roaming Included with UK Allowance
              </span>
            )}
          </div>

          {/* Zone Selector Pills */}
          <div className="flex items-center gap-2 pt-4 pb-4 overflow-x-auto">
            {ZONES_DATA.map((z) => (
              <button
                key={z.zone}
                type="button"
                onClick={() => setSelectedZone(z.zone)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedZone === z.zone
                    ? "bg-[#0e8f74] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {z.zone}
              </button>
            ))}
          </div>

          {/* Active Zone Detail Card */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-emerald-50/20 dark:from-gray-750 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{activeZoneDetails.zoneName}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  <span className="font-semibold text-gray-800 dark:text-white">Included Countries: </span>
                  {activeZoneDetails.countries}
                </p>
              </div>
            </div>

            {/* 4 Rate Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200/80 dark:border-gray-700">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Database className="w-3.5 h-3.5 text-[#ec4faa]" />
                  <span>Data</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#0e8f74] dark:text-[#34d39e]">
                  {activeZoneDetails.dataPriceMb} <span className="text-xs font-normal text-gray-500">/ MB</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#e6007e]" />
                  <span>Calls Sent</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                  {activeZoneDetails.callSent} <span className="text-xs font-normal text-gray-500">/ min</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Calls Received</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                  {activeZoneDetails.callReceived} <span className="text-xs font-normal text-gray-500">/ min</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#6d5dd3]" />
                  <span>Text (SMS)</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                  {activeZoneDetails.textSent} <span className="text-xs font-normal text-gray-500">sent · £0.00 rec</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 1. Text Charges Table ─── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <Pill label="TEXT" color="text" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">Roaming Zone Charges (Text)</h2>
          </div>
          <TableShell>
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-4 align-top w-2/5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Zones</p>
                  <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Countries included in Zone</p>
                </th>
                <th className="px-5 py-4 align-top">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Text Sent</p>
                  <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">To any destination whilst abroad (£)</p>
                </th>
                <th className="px-5 py-4 align-top">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Text Received</p>
                  <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Received whilst abroad (£)</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {ZONES_DATA.map((r) => (
                <tr key={r.zone} className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-750 transition">
                  <td className="px-5 py-4 align-top">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.zone} Countries</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2" title={r.countries}>
                      {r.countries}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.textSent}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.textReceived} (Free)</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>

        {/* ─── 2. Calls Charges Table ─── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <Pill label="CALLS" color="calls" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">Roaming Zones (Calls)</h2>
          </div>
          <TableShell>
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-4 align-top w-2/5">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Zones &amp; Countries</p>
                </th>
                <th className="px-5 py-4 align-top">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Minute (Calls Sent)</p>
                  <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Sent from visited Zones to any destination (£/min)</p>
                </th>
                <th className="px-5 py-4 align-top">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Cost Per Minute (Calls Received)</p>
                  <p className="mt-0.5 text-xs font-normal text-gray-400 dark:text-gray-500">Received whilst abroad (£/min)</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {ZONES_DATA.map((r) => (
                <tr key={r.zone} className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-750 transition">
                  <td className="px-5 py-4 align-top">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.zone} Countries</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2" title={r.countries}>
                      {r.countries}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.callSent} / min</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.callReceived} / min</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>

        {/* ─── 3. Data Charges Table ─── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <Pill label="DATA" color="data" />
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl dark:text-white">Zoiko Roaming Zone Charges (Data)</h2>
          </div>
          <TableShell>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <th className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200 w-2/5">Zones &amp; Countries</th>
                <th className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">Price (£)/MB</th>
                <th className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">Equivalent per GB</th>
              </tr>
            </thead>
            <tbody>
              {ZONES_DATA.map((r) => {
                const numMb = parseFloat(r.dataPriceMb.replace("£", ""));
                const approxGb = (numMb * 1024).toFixed(2);
                return (
                  <tr key={r.zone} className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50/60 dark:hover:bg-gray-750 transition">
                    <td className="px-5 py-4 align-top">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.zone} Countries</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2" title={r.countries}>
                        {r.countries}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{r.dataPriceMb} / MB</td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-600 dark:text-gray-300">~£{approxGb} / GB</td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
          <p className="mt-4 text-center text-xs italic text-gray-400 dark:text-gray-500">
            Roaming Data is billed per kilobyte sent to or from Subscribers.
          </p>
        </section>

        {/* ─── For Pay Monthly Subscribers ─── */}
        <section className="overflow-hidden rounded-2xl border-t-4 border-[#17a06a] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
          <h2 className="text-center text-lg font-bold text-gray-800 dark:text-white">For Pay Monthly Subscribers</h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-gray-300">
            For monthly recurring data bundles,{" "}
            <strong className="font-semibold text-gray-700 dark:text-gray-100">Zoiko Mobile does not impose a cap</strong>, and any
            Out-of-Bundle usage will be charged at the{" "}
            <strong className="font-semibold text-gray-700 dark:text-gray-100">Data Out-of-Bundle Charge rate</strong>. Subscriptions
            are charged upfront for the upcoming month. Pro-rata charges apply during the first billing
            period from the date of bundle activation until the next bill-cycle date.
          </p>
        </section>

        {/* ─── Voice And Text Bundles ─── */}
        <section className="overflow-hidden rounded-2xl border-t-4 border-[#e6007e] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 dark:bg-gray-800 dark:ring-gray-700">
          <h2 className="text-center text-lg font-bold text-gray-800 dark:text-white">Voice And Text Bundles</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-500 dark:text-gray-300">
            <p>
              Zoiko Mobile offers{" "}
              <strong className="font-semibold text-gray-700 dark:text-gray-100">Voice and Text Bundles for National Calls and National Texts</strong>{" "}
              within the Underlying Mobile Network and while roaming in Zone 1 (to comply with RLAH
              regulations). These bundles do not cover Calls and SMS while roaming outside the EU, to any
              International destination, to any Premium or Special numbers or Services, or incoming Calls and
              Texts.{" "}
              <strong className="font-semibold text-gray-700 dark:text-gray-100">
                Please note that only one Voice and Texts Bundle can be subscribed to per SIM card at a time.
                Pro-rata charges are applied during the first billing period from the date of Bundle activation
                until the next bill-cycle date. No pro-rata balance is refunded upon Bundle de-activation (the
                last month is fully billed).
              </strong>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
