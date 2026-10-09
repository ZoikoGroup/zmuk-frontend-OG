import Image from "next/image";
import Link from "next/link";

// ─── ICONS (inline SVG) ────────────────────────────────────────────────────────

function Facebook({ className = "h-7 w-7" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.4 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z" /></svg>);
}
function XIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.6l-5.2-6.8L5.5 22H2.4l7.6-8.7L1.2 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.8L7.1 3.9H5.2L17.7 20z" /></svg>);
}
function YouTube({ className = "h-7 w-7" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.5a3 3 0 00-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 001 7.5 31 31 0 00.5 12 31 31 0 001 16.5a3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1A31 31 0 0023.5 12 31 31 0 0023 7.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" /></svg>);
}
function LinkedIn({ className = "h-7 w-7" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9h3v10zM6.5 7.7a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM19 19h-3v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.3a3 3 0 012.7-1.5c2 0 3.2 1.3 3.2 4V19z" /></svg>);
}
function Instagram({ className = "h-7 w-7" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>);
}
function Pinterest({ className = "h-7 w-7" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-2.3 3.1-5 0-2.1-1.4-3.6-3.9-3.6a4.5 4.5 0 00-4.7 4.5c0 .9.3 1.5.8 2 .1.1.1.2.1.3l-.3 1.1c0 .2-.2.2-.4.1-1.1-.5-1.7-1.9-1.7-3.1 0-2.5 1.8-5.4 5.5-5.4 2.9 0 4.9 2.1 4.9 4.4 0 3-1.7 5.3-4.2 5.3-.8 0-1.6-.4-1.9-.9l-.5 2c-.2.7-.6 1.5-.9 2A10 10 0 1012 2z" /></svg>);
}
function MapPin({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2" /></svg>);
}
function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2l2 5-2 1a12 12 0 006 6l1-2 5 2v2a2 2 0 01-2 2A16 16 0 013 5z" /></svg>);
}
function MailIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path strokeLinecap="round" d="M4 7l8 6 8-6" /></svg>);
}

// ─── DATA ────────────────────────────────────────────────────────────────────
//
// Empty `href: ""` slots fall back to "#" until you add the real route.

type FooterLink = { label: string; href: string };

const linkColumns: { title: string; links: FooterLink[] }[] = [
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

// App store buttons — add the real store URLs in `href`.
const storeButtons = [
  { label: "Google Play", img: "/images/apple.png", href: "" },
  { label: "App Store", img: "/images/play.png", href: "" },
];

// Social links — fill each `href`.
const socials = [
  { label: "Facebook", href: "https://www.facebook.com/zoikomobileUK", Icon: Facebook },
  { label: "X", href: "https://x.com/zoikomobileUK", Icon: XIcon },
  { label: "YouTube", href: "https://www.youtube.com/@ZoikoMobileUK", Icon: YouTube },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/zoiko-mobile-uk/", Icon: LinkedIn },
  { label: "Instagram", href: "https://www.instagram.com/zoikomobileuk/", Icon: Instagram },
  { label: "Pinterest", href: "https://uk.pinterest.com/zoikomobileuk/", Icon: Pinterest },
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

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#1ba36b] to-[#0e8f74] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 lg:py-16">
        {/* Top: brand + link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand block */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            {/* Logo */}
            <div className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5">
              <span className="relative block h-9 w-32">
                <Image src="/images/logo.png" alt="Zoiko Mobile" fill sizes="128px" className="object-contain" />
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/80">
              Empowering individuals and businesses with seamless, reliable connectivity wherever it matters most.
            </p>

            {/* App store buttons */}
            <div className="mt-5 flex flex-wrap gap-3">
              {storeButtons.map((btn) => (
                <Link
                  key={btn.label}
                  href={btn.href || "#"}
                  className="flex items-center gap-2 rounded-lg border border-white/40 px-3 py-2 transition-colors hover:bg-white/10"
                >
                  <span className="relative h-5 w-5 flex-shrink-0">
                    <Image src={btn.img} alt="" fill sizes="20px" className="object-contain" />
                  </span>
                  <span className="text-xs font-medium">{btn.label}</span>
                </Link>
              ))}
            </div>

            {/* Social icons */}
            <div className="mt-6 flex flex-wrap gap-4 text-black">
              {socials.map((s) => (
                <Link key={s.label} href={s.href || "#"} aria-label={s.label} className="transition-opacity hover:opacity-70">
                  <s.Icon className="h-8 w-8" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href || "#"} className="text-sm text-white/80 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr className="my-10 border-white/20" />

        {/* Offices */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <div key={office.city}>
              <h4 className="text-sm font-bold">{office.city}</h4>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="leading-relaxed">{office.address}</span>
                </p>
                <a href={`tel:${office.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 transition-colors hover:text-white">
                  <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{office.phone}</span>
                </a>
                <a href={`mailto:${office.email}`} className="flex items-center gap-2 transition-colors hover:text-white">
                  <MailIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{office.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom divider + copyright */}
        <hr className="my-8 border-white/20" />
        <p className="text-center text-xs leading-relaxed text-white/70">
          © 2025 Zoiko Mobile UK. Zoiko Mobile UK is a trading name for Zoiko Mobile (UK) Ltd. Registered in England and Wales (No. 16564980). All rights reserved.
        </p>
      </div>
    </footer>
  );
}