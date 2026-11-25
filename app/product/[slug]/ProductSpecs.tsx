"use client";

import { useMemo, useState } from "react";
import { Check, FileText, ListChecks } from "lucide-react";

interface AttrOption { name: string; slug: string; options: string[] }

// Turn the description (plain text or simple HTML from the admin) into clean lines.
// Tags are stripped rather than rendered, so nothing from the API is injected as HTML.
function toLines(raw: string): string[] {
  const text = raw
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6]|tr)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/\s*t[dh]\s*>/gi, ": ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/:\s*$/, "").trim())
    .filter(Boolean);
}

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] };

// Lines like "Display: 6.1-inch OLED" become specification rows; the rest is description.
function parseDescription(raw: string) {
  const specs: [string, string][] = [];
  const blocks: Block[] = [];
  for (const line of toLines(raw)) {
    const spec = line.match(/^[•\-*]?\s*([A-Za-z][\w &/().+-]{1,32}?)\s*[:|\t]\s*(.{1,160})$/);
    if (spec && !/[.!?]$/.test(spec[1])) {
      specs.push([spec[1].trim(), spec[2].trim()]);
      continue;
    }
    const bullet = line.match(/^[•\-*]\s*(.+)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
    } else {
      blocks.push({ kind: "p", text: line });
    }
  }
  return { specs, blocks };
}

export default function ProductSpecs({
  name,
  brand,
  description,
  attributeOptions,
  selected,
  sku,
}: {
  name: string;
  brand: string;
  description: string;
  attributeOptions: AttrOption[];
  selected: Record<string, string>;
  sku: string | null;
}) {
  const { specs: descSpecs, blocks } = useMemo(() => parseDescription(description ?? ""), [description]);
  const hasDescription = blocks.length > 0;
  const [chosenTab, setTab] = useState<"description" | "specs">("description");
  const tab = chosenTab === "description" && !hasDescription ? "specs" : chosenTab;

  const generalRows: [string, string][] = [
    ...(brand ? [["Brand", brand] as [string, string]] : []),
    ["Model", name],
    ...(sku ? [["SKU", sku] as [string, string]] : []),
  ];
  const known = new Set(generalRows.map(([k]) => k.toLowerCase()));
  const extraRows = descSpecs.filter(([k]) => !known.has(k.toLowerCase()));

  const tabs = [
    ...(hasDescription ? [{ id: "description" as const, label: "Description", Icon: FileText }] : []),
    { id: "specs" as const, label: "Specifications", Icon: ListChecks },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 pt-10">
      <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
        {/* Tabs */}
        <div role="tablist" aria-label="Device information" className="flex gap-1 border-b border-gray-100 bg-gray-50/60 px-3 pt-3 sm:px-6">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={active}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`relative inline-flex items-center gap-2 rounded-t-2xl px-4 py-3 text-sm font-bold transition sm:px-6 ${
                  active ? "bg-white text-[#e6007e] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-[#e6007e]" />}
              </button>
            );
          })}
        </div>

        {/* Description */}
        {tab === "description" && hasDescription && (
          <div role="tabpanel" id="panel-description" aria-labelledby="tab-description" className="p-6 sm:p-8">
            <h2 className="text-xl font-black text-gray-900 sm:text-2xl">About the {name}</h2>
            <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-relaxed text-gray-600">
              {blocks.map((b, i) =>
                b.kind === "p" ? (
                  <p key={i}>{b.text}</p>
                ) : (
                  <ul key={i} className="grid gap-2 sm:grid-cols-2">
                    {b.items.map((item) => (
                      <li key={item} className="flex gap-2.5 rounded-xl bg-[#FFF5FA] px-3.5 py-2.5 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#e6007e]" strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        )}

        {/* Specifications */}
        {tab === "specs" && (
          <div role="tabpanel" id="panel-specs" aria-labelledby="tab-specs" className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#e6007e]">General</h3>
              <dl className="overflow-hidden rounded-2xl border border-gray-100">
                {[...generalRows, ...extraRows].map(([k, v], i) => (
                  <div key={`${k}-${i}`} className={`grid grid-cols-5 gap-4 px-4 py-3 text-sm ${i % 2 ? "bg-white" : "bg-gray-50/70"}`}>
                    <dt className="col-span-2 font-semibold text-gray-500">{k}</dt>
                    <dd className="col-span-3 font-semibold text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {attributeOptions.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#e6007e]">Available options</h3>
                <dl className="space-y-3">
                  {attributeOptions.map((opt) => (
                    <div key={opt.name} className="rounded-2xl border border-gray-100 p-4">
                      <dt className="text-sm font-semibold text-gray-500">{opt.name}</dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {opt.options.map((val) => {
                          const isSel = selected[opt.name] === val;
                          return (
                            <span
                              key={val}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                                isSel ? "bg-[#e6007e] text-white" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                              {val}
                            </span>
                          );
                        })}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
