"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

// ─── DATA ──────────────────────────────────────────────────────────────────

type ZoneRow = {
  zone: string;
  countries: string;
  call: string;
  text: string;
  data: string;
  overage: string;
};

const zones: ZoneRow[] = [
  {
    zone: "Zone 1",
    countries: "Ireland, Isle of Man, Guernsey, Jersey, Isle of Man",
    call: "10p", text: "10p", data: "43p", overage: "N/A",
  },
  {
    zone: "Zone 2",
    countries: "Albania, Andorra, Austria, Belgium, Bosnia, Bulgaria, Croatia, Czech, Estonia, Denmark, Finland, France, Germany, Gibraltar, Greece, Hungary, Iceland, Italy, Latvia, Liechtenstein, Lithuania, Luxembourg, Macedonia, Malta, Monaco, Netherlands, Norway, Poland, Portugal, Romania, San Marino, Serbia, Slovakia, Slovenia, Spain, Sweden, Switzerland, Turkey, Vatican",
    call: "33p", text: "20p", data: "43p", overage: "N/A",
  },
  {
    zone: "Zone 3",
    countries: "Australia, China, Hong Kong, India, New Zealand, Philippines, Singapore, South Korea",
    call: "43p", text: "20p", data: "43p", overage: "N/A",
  },
  {
    zone: "Zone 4",
    countries: "USA",
    call: "33p", text: "30p", data: "43p", overage: "N/A",
  },
  {
    zone: "Zone 5",
    countries: "Algeria, Cyprus, Egypt, Israel, Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Qatar, Saudi Arabia, Syria, Tunisia, Turkey, United Arab Emirates",
    call: "83p", text: "30p", data: "43p", overage: "N/A",
  },
  {
    zone: "Rest of World",
    countries: "Afghanistan, Aland Islands, American Samoa, Angola, Anguilla, Antarctica, Antigua and Barbuda, Argentina, Armenia, Aruba, Azerbaijan, Bahamas, Bahrain, Bangladesh, Barbados, Belarus, Belize, Benin, Bermuda, Bhutan, Bolivia, Bonaire Saba and Eustatius, Botswana, Bouvet Island, Brazil, British Indian Ocean Territory, British Virgin Islands, Brunei, Burkina Faso, Burundi, Cambodia, Cameroon, Canada, Cape Verde, Caribbean Netherlands, Cayman Islands, Central African Republic, Chad, Chile, Christmas Island, Cocos Islands, Colombia, Comoros, Congo-Brazzaville, Congo-Kinshasa, Cook Islands, Costa Rica, Cote d'Ivoire, Cuba, Curacao, Cyprus, Diego Garcia, Djibouti, Dominica, Dominican Republic, East Timor, Ecuador, El Salvador, Equatorial Guinea, Eritrea, Ethiopia, Falkland Islands, Faroe Islands, Fiji, French Guiana, French Polynesia, French Southern and Antarctic Lands, Gabon, Gambia, Georgia, Ghana, Greenland, Grenada, Guadeloupe, Guam, Guatemala, Guinea, Guinea-Bissau, Guyana, Haiti, Heard Island and McDonald Islands, Honduras, Indonesia, Iran, Iraq, Jamaica, Japan, Kazakhstan, Kenya, Kiribati, Kosovo, Kyrgyzstan, Laos, Lebanon, Lesotho, Liberia, Libya, Macau, Madagascar, Malawi, Malaysia, Maldives, Mali, Marshall Islands, Martinique, Mauritania, Mauritius, Mayotte, Mexico, Micronesia, Moldova, Mongolia, Montenegro, Montserrat, Mozambique, Myanmar, Namibia, Nauru, Nepal, Netherlands Antilles, New Caledonia, Nicaragua, Niger, Nigeria, Niue, Norfolk Island, North Korea, Northern Mariana Islands, Pakistan, Palau, Palestinian Territories, Panama, Papua New Guinea, Paraguay, Peru, Pitcairn Islands, Puerto Rico, Reunion, Russia, Rwanda, Saint Barthélemy, Saint Helena, Saint Kitts and Nevis, Saint Lucia, Saint Martin, Saint Pierre and Miquelon, Saint Vincent and the Grenadines, Samoa, Sao Tome and Principe, Senegal, Seychelles, Sierra Leone, Sint Maarten, Solomon Islands, Somalia, South Africa, South Georgia and the South Sandwich Islands, South Sudan, Sri Lanka, Sudan, Suriname, Svalbard and Jan Mayen, Swaziland, Taiwan, Tajikistan, Tanzania, Thailand, Togo, Tokelau, Tonga, Trinidad and Tobago, Tristan da Cunha, Tunisia, Turkmenistan, Turks and Caicos Islands, Tuvalu, Uganda, Ukraine, United States Minor Outlying Islands, Uruguay, Uzbekistan, Vanuatu, Venezuela, Vietnam, Virgin Islands US, Wallis and Futuna, Western Sahara, Yemen, Zambia, Zimbabwe",
    call: "83p", text: "30p", data: "43p", overage: "N/A",
  },
];

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Bundless() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) => z.zone.toLowerCase().includes(q) || z.countries.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <main className="bg-[#f7f8fa] font-sans text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-16 text-center text-white sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">International Out-of-Bundle Rates</h1>
        <p className="mt-3 text-sm text-white/90 sm:text-base">Transparent pricing for calls, texts, and data worldwide</p>
      </section>

      <section className="px-4 py-12 sm:px-6 md:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10">

          {/* Card header */}
          <div className="flex items-center gap-5 bg-[#0e8f74] px-6 py-7 sm:px-8">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-white/20">
              <Image src="/images/International Rates.png" alt="World map" fill sizes="80px" className="object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">International Rates (Calls, Texts &amp; MMS)</h2>
              <p className="mt-1 text-sm text-white/80">Overage Rates</p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Search */}
            <div className="relative mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by country or zone..."
                className="w-full rounded-lg border border-gray-300 py-3 pl-4 pr-11 text-sm focus:border-[#0e8f74] focus:outline-none focus:ring-1 focus:ring-[#0e8f74] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#0e8f74] text-white">
                    <th className="rounded-l-md px-4 py-3 font-semibold">Zone</th>
                    <th className="px-4 py-3 font-semibold">Countries</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Call (Per Min) £</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Text (10p)</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Data (Per MB) £</th>
                    <th className="rounded-r-md px-4 py-3 font-semibold whitespace-nowrap">Overage Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        No zones or countries match &ldquo;{query}&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((z) => (
                      <tr key={z.zone} className="border-b border-gray-100 align-top dark:border-gray-700">
                        <td className="px-4 py-4 font-bold text-[#0e8f74] whitespace-nowrap dark:text-[#34d39e]">{z.zone}</td>
                        <td className="px-4 py-4 leading-relaxed text-gray-600 dark:text-gray-300">{z.countries}</td>
                        <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">{z.call}</td>
                        <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">{z.text}</td>
                        <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">{z.data}</td>
                        <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">{z.overage}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Note */}
            <div className="mt-6 rounded-lg border-l-4 border-sky-400 bg-sky-50 p-5 text-sm leading-relaxed text-sky-900 dark:bg-sky-900/20 dark:text-sky-200">
              <span className="font-bold">Note:</span> These rates apply to out-of-bundle usage. All prices are subject
              to change. For the most current rates, please contact customer support.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


