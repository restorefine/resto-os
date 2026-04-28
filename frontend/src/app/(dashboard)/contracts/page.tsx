"use client";

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClients } from "@/hooks/useClients";
import { Client } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

// ─── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  clientId:       z.string().min(1, "Select a client"),
  clientName:     z.string().min(1, "Required"),
  clientCompany:  z.string().min(1, "Required"),
  clientAddress:  z.string().min(1, "Required"),
  clientPhone:    z.string().min(1, "Required"),
  startDate:      z.string().min(1, "Required"),
  videoCount:     z.number().min(1),
  photoCount:     z.number().min(1),
  totalInvestment:z.number().min(1),
  payment1:       z.number().min(1),
  payment2:       z.number().min(1),
});

type FormData = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addWeeks(dateStr: string, weeks: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function fmtShort(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtGBP(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

// ─── Contract preview component ───────────────────────────────────────────────

function ContractDocument({ data }: { data: FormData }) {
  const startDate = new Date(data.startDate);
  const endDate = addWeeks(data.startDate, 12);
  const sprintLabel = `${fmtShort(startDate)} – ${fmtShort(endDate)}`;

  const pageStyle: React.CSSProperties = { padding: "18mm 18mm 18mm" };

  return (
    <div
      id="contract-print"
      className="bg-white text-[#111] font-[Arial,sans-serif] text-[11px] leading-[1.55]"
      style={{ width: "210mm" }}
    >
      {/* ══════════════════════════════════════════════════════════════
          PAGE 1 — Header, Parties, Sections 1–3
      ══════════════════════════════════════════════════════════════ */}
      <div style={pageStyle}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "14px", borderBottom: "2px solid #111" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoV3-black.svg" alt="R" style={{ width: "52px", height: "52px", objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "-0.02em", lineHeight: 1 }}>RestoRefine Studios</div>
              <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", lineHeight: "1.5" }}>
                24 Fairley Street, Glasgow, G51 2SN<br />0141 266 0065
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: "#d01414", color: "#fff", padding: "10px 16px", textAlign: "right", minWidth: "170px" }}>
            <div style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "0.05em", textTransform: "uppercase" }}>12-WEEK SPRINT</div>
            <div style={{ fontSize: "10px", marginTop: "2px", fontWeight: "500" }}>{sprintLabel}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Social Media Growth Sprint Agreement
          </div>
          <div style={{ fontSize: "10px", color: "#555", marginTop: "3px" }}>
            Service Agreement between RestoRefine Studios and {data.clientCompany || data.clientName}
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: "16px", border: "1px solid #ddd" }}>
          <div style={{ padding: "12px 14px", borderRight: "1px solid #ddd" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Service Provider</div>
            <div style={{ fontWeight: "900", fontSize: "12px" }}>RestoRefine LTD</div>
            <div style={{ color: "#555", fontSize: "10px", marginTop: "2px" }}>{`("RestoRefine Studios")`}</div>
            <div style={{ color: "#555", fontSize: "10px", marginTop: "4px", lineHeight: "1.5" }}>
              24 Fairley Street, Glasgow, G51 2SN<br />0141 266 0065
            </div>
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Client</div>
            <div style={{ fontWeight: "900", fontSize: "12px" }}>{data.clientName}</div>
            {data.clientCompany && <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>{data.clientCompany}</div>}
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", lineHeight: "1.6" }}>
              {data.clientAddress && <>{data.clientAddress}<br /></>}{data.clientPhone}
            </div>
          </div>
        </div>

        {/* Intro */}
        <p style={{ marginBottom: "14px", fontSize: "10.5px" }}>
          This agreement (&ldquo;Agreement&rdquo;) sets out the terms under which RestoRefine Studios Ltd will deliver social
          media content services to the Client for the sprint period defined above. By signing below, both parties
          confirm they have read, understood, and agree to be bound by these terms.
        </p>

        {/* §1 */}
        <Section n="1" title="Purpose">
          <p>The objective of this Sprint is to increase local brand awareness for {data.clientCompany || data.clientName}, build a consistent and high-quality online presence, and establish a content foundation that drives ongoing customer engagement and visibility. This is a structured, outcome-focused engagement designed to deliver measurable brand positioning improvements over a fixed 12-week period.</p>
        </Section>

        {/* §2 */}
        <Section n="2" title="Sprint Timeline">
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: "10.5px" }}>
            <tbody>
              {[["Start Date", fmtDate(startDate)], ["End Date", fmtDate(endDate)], ["Duration", "12 Weeks"]].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: "4px 0", fontWeight: "700", width: "140px" }}>{label}</td>
                  <td style={{ padding: "4px 0" }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>Due to operational capacity and quality control standards, RestoRefine Studios limits the number of clients onboarded per quarter. Availability is allocated on a first-come, first-served basis.</p>
        </Section>

        {/* §3 */}
        <Section n="3" title="Scope of Services">
          <p style={{ marginBottom: "10px" }}>RestoRefine Studios will deliver the following within this Agreement:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #ddd", marginBottom: "10px" }}>
            <div style={{ padding: "12px 16px", borderRight: "1px solid #ddd" }}>
              <div style={{ fontSize: "32px", fontWeight: "900", color: "#d01414", lineHeight: 1 }}>{data.videoCount}</div>
              <div style={{ fontWeight: "700", fontSize: "11px", marginTop: "4px" }}>Short-Form Video Contents</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: "32px", fontWeight: "900", lineHeight: 1 }}>{data.photoCount}</div>
              <div style={{ fontWeight: "700", fontSize: "11px", marginTop: "4px" }}>Photo / Graphic Posts</div>
            </div>
          </div>
          <p style={{ marginBottom: "6px" }}>This includes:</p>
          <ul style={{ paddingLeft: "0", listStyle: "none", marginBottom: "10px" }}>
            {["Content planning and strategy aligned with growth objectives","Scriptwriting and creative direction","Filming and production","Editing and optimisation for social platforms","Caption writing and hashtag strategy","Content scheduling and posting"].map(item => (
              <li key={item} style={{ padding: "1px 0 1px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
          <p style={{ marginBottom: "6px" }}>Content will be managed across TikTok, Instagram, and Facebook.</p>
          <p>Any additional content or services outside this scope will be quoted separately and require written approval from the Client before commencement.</p>
        </Section>
      </div>

      {/* Visual page divider in preview (hidden when printing) */}
      <div className="preview-page-break" style={{ height: "24px", background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>Page 2</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PAGE 2 — Sections 4–10
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ ...pageStyle, pageBreakBefore: "always", breakBefore: "page" }}>
        {/* §4 */}
        <Section n="4" title="Payment Terms">
          <div style={{ backgroundColor: "#d01414", color: "#fff", textAlign: "center", padding: "12px", fontSize: "13px" }}>
            Total Sprint Investment:&nbsp;<span style={{ fontSize: "22px", fontWeight: "900" }}>{fmtGBP(data.totalInvestment)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #ddd", marginBottom: "12px" }}>
            <div style={{ padding: "12px 16px", borderRight: "1px solid #ddd" }}>
              <div style={{ fontWeight: "700", fontSize: "10.5px", marginBottom: "3px" }}>Payment 1 – Due on signing</div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#d01414" }}>{fmtGBP(data.payment1)}</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontWeight: "700", fontSize: "10.5px", marginBottom: "3px" }}>Payment 2 – After first shoot</div>
              <div style={{ fontSize: "22px", fontWeight: "900" }}>{fmtGBP(data.payment2)}</div>
            </div>
          </div>
          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {[`Work will not commence until the initial payment of ${fmtGBP(data.payment1)} has been received.`,"Failure to complete the second payment may result in suspension of services until payment is cleared.","A 15% late fee may be applied to any overdue payment."].map(item => (
              <li key={item} style={{ padding: "2px 0 2px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* §5 */}
        <Section n="5" title="Client Responsibilities">
          <p style={{ marginBottom: "6px" }}>The Client agrees to:</p>
          <ul style={{ paddingLeft: "0", listStyle: "none", marginBottom: "10px" }}>
            {["Provide access to all relevant social media accounts in advance of the start date","Be available and accessible for all scheduled content shoots","Provide timely feedback and approvals on content drafts","Ensure operational readiness (staff, food, environment) during filming sessions"].map(item => (
              <li key={item} style={{ padding: "2px 0 2px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
          <p>Delays in communication or access may impact delivery timelines. RestoRefine Studios will not be held responsible for delays directly caused by the Client.</p>
        </Section>

        {/* §6 */}
        <Section n="6" title="Paid Advertising (Optional)">
          <p style={{ marginBottom: "6px" }}>Paid social advertising may be implemented at the Client&apos;s sole discretion. Where applicable:</p>
          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {["All ad spend is determined and funded entirely by the Client","RestoRefine Studios charges a 20% management fee on total ad spend","Creative assets for ads will be included within the sprint deliverables where applicable"].map(item => (
              <li key={item} style={{ padding: "2px 0 2px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* §7 */}
        <Section n="7" title="Performance Disclaimer">
          <p style={{ marginBottom: "8px" }}>RestoRefine Studios does not guarantee specific results including, but not limited to, views, followers, engagement rates, or revenue outcomes. Social media performance is influenced by factors outside of RestoRefine&apos;s control, including platform algorithms, market competition, customer behaviour, and the Client&apos;s own product or service offering.</p>
          <p>This Sprint is structured to maximise visibility, content consistency, and long-term growth positioning for the Client&apos;s brand.</p>
        </Section>

        {/* §8 */}
        <Section n="8" title="Limitation of Liability">
          <p style={{ marginBottom: "6px" }}>RestoRefine Studios shall not be held liable for:</p>
          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {["Loss of revenue, profit, or business performance","Platform-related issues including account bans, restrictions, or service outages","Any external factors beyond RestoRefine Studios' reasonable control"].map(item => (
              <li key={item} style={{ padding: "2px 0 2px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* §9 */}
        <Section n="9" title="Content Rights">
          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {["RestoRefine Studios retains the right to use all created content for portfolio, marketing, and promotional purposes, including across its own social media channels and website.","The Client retains full, unlimited usage rights for all content created under this Agreement for their own business purposes."].map(item => (
              <li key={item} style={{ padding: "2px 0 2px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
        </Section>

        {/* §10 */}
        <Section n="10" title="Termination">
          <p style={{ marginBottom: "6px" }}>This is a fixed-term Sprint and cannot be cancelled once work has commenced. In the event of early termination by the Client:</p>
          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {["All payments made are non-refundable","Any remaining undelivered deliverables may be forfeited at RestoRefine Studios' discretion"].map(item => (
              <li key={item} style={{ padding: "2px 0 2px 16px", position: "relative" }}><span style={{ position: "absolute", left: 0 }}>–</span>{item}</li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Visual page divider in preview */}
      <div className="preview-page-break" style={{ height: "24px", background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>Page 3</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PAGE 3 — Sections 11–12 + Signatures
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ ...pageStyle, pageBreakBefore: "always", breakBefore: "page" }}>
        {/* §11 */}
        <Section n="11" title="Post-Sprint Continuation">
          <p>Upon conclusion of the 12-week Sprint, the Client may be offered a follow-on Growth Sprint or a monthly content management plan. Any continuation is subject to availability and mutual written agreement between both parties.</p>
        </Section>

        {/* §12 */}
        <Section n="12" title="Governing Law">
          <p>This Agreement shall be governed by and construed in accordance with the laws of Scotland. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the Scottish courts.</p>
        </Section>

        {/* Signatures */}
        <div style={{ marginTop: "22px", pageBreakInside: "avoid", breakInside: "avoid" }}>
          <div style={{ backgroundColor: "#111", color: "#fff", textAlign: "center", padding: "10px", fontWeight: "900", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            Agreement &amp; Signatures
          </div>
          <p style={{ marginBottom: "16px", fontSize: "10.5px" }}>
            By signing below, both parties confirm they have read this Agreement in full, understand its terms, and agree to be legally bound by it.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #ddd" }}>
            <div style={{ padding: "14px 16px", borderRight: "1px solid #ddd" }}>
              <div style={{ fontSize: "9px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Client</div>
              <div style={{ fontWeight: "900", fontSize: "12px" }}>{data.clientName}</div>
              {data.clientCompany && <div style={{ fontSize: "10px", color: "#555" }}>{data.clientCompany}</div>}
              <div style={{ marginTop: "40px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "9px", color: "#888" }}>Signature</div>
              <div style={{ marginTop: "28px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "9px", color: "#888" }}>Date</div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "9px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Service Provider</div>
              <div style={{ fontWeight: "900", fontSize: "12px" }}>Harpreet Singh</div>
              <div style={{ fontSize: "10px", color: "#555" }}>RestoRefine Studios Ltd</div>
              <div style={{ marginTop: "40px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "9px", color: "#888" }}>Signature</div>
              <div style={{ marginTop: "28px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "9px", color: "#888" }}>Date</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "18px", textAlign: "center", fontSize: "9px", color: "#888", borderTop: "1px solid #e5e5e5", paddingTop: "10px" }}>
          RestoRefine Studios Ltd &middot; 24 Fairley Street, Glasgow, G51 2SN &middot; 0141 266 0065<br />
          Social Media Growth Sprint &middot; {data.clientCompany || data.clientName} &middot; {fmtShort(startDate)} – {fmtShort(endDate)}
        </div>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px", pageBreakInside: "avoid", breakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>
        <span style={{ fontWeight: "900", fontSize: "11.5px" }}>{n}.&nbsp; {title}</span>
      </div>
      <div style={{ fontSize: "10.5px" }}>{children}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900 bg-white";

export default function ContractsPage() {
  const { data: clients = [] } = useClients();
  const printRef = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      videoCount: 18,
      photoCount: 10,
      totalInvestment: 1600,
      payment1: 1000,
      payment2: 600,
    },
  });

  // Live — watch everything so the preview updates on every keystroke
  const formValues = watch();

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const client = clients.find((c: Client) => c.id === e.target.value);
    if (!client) return;
    setValue("clientId", client.id);
    setValue("clientName", client.name);
    setValue("clientCompany", client.name);
    setValue("clientPhone", client.phone ?? "");
  };

  const handlePrint = () => {
    const content = document.getElementById("contract-print");
    if (!content) return;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contract – ${formValues.clientName ?? ""}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: white; }
            @page { margin: 20mm 18mm; size: A4; }
            #contract-print {
              padding: 0 !important;
              width: 100% !important;
              min-height: unset !important;
            }
            .preview-page-break { display: none !important; }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <div className="max-w-[1400px]">
      <PageHeader title="Contract Generator" subtitle="Generate and download client contracts" />

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">

        {/* ── Form ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-gray-400">Contract Details</p>
          </div>

          <form className="px-5 py-5 space-y-5">

            {/* Client */}
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Client</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Client</label>
                <select
                  {...register("clientId")}
                  onChange={handleClientChange}
                  className={inp}
                >
                  <option value="">Choose existing client...</option>
                  {clients.map((c: Client) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.clientId && <p className="mt-1 text-xs text-red-500">{errors.clientId.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Name (for contract)</label>
                <input {...register("clientName")} placeholder="e.g. MOHAMMED, Sulman" className={inp} />
                {errors.clientName && <p className="mt-1 text-xs text-red-500">{errors.clientName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company / Trading Name</label>
                <input {...register("clientCompany")} placeholder="e.g. Curry Lounge (CURRYHOUSEPORT LTD)" className={inp} />
                {errors.clientCompany && <p className="mt-1 text-xs text-red-500">{errors.clientCompany.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <textarea
                  {...register("clientAddress")}
                  rows={2}
                  placeholder="46 Princes Street, Port Glasgow, Inverclyde, PA14 5JQ"
                  className={`${inp} resize-none`}
                />
                {errors.clientAddress && <p className="mt-1 text-xs text-red-500">{errors.clientAddress.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input {...register("clientPhone")} placeholder="+44 7599 064917" className={inp} />
                {errors.clientPhone && <p className="mt-1 text-xs text-red-500">{errors.clientPhone.message}</p>}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Timeline */}
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Sprint Timeline</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input {...register("startDate")} type="date" className={inp} />
                {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Scope */}
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Scope of Services</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Short-Form Videos</label>
                  <input
                    {...register("videoCount", { valueAsNumber: true })}
                    type="number" min={1}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Photo / Graphic Posts</label>
                  <input
                    {...register("photoCount", { valueAsNumber: true })}
                    type="number" min={1}
                    className={inp}
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Payment */}
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Payment Terms</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total Sprint Investment (£)</label>
                <input {...register("totalInvestment", { valueAsNumber: true })} type="number" min={1} className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment 1 – On signing (£)</label>
                  <input {...register("payment1", { valueAsNumber: true })} type="number" min={1} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment 2 – After shoot (£)</label>
                  <input {...register("payment2", { valueAsNumber: true })} type="number" min={1} className={inp} />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* ── Live Preview ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">
              Live Preview
              {formValues.clientCompany || formValues.clientName
                ? <span className="text-gray-400 font-normal"> — {formValues.clientCompany || formValues.clientName}</span>
                : <span className="text-gray-400 font-normal text-xs"> · fill in the form to see changes</span>
              }
            </p>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Download size={13} /> Download PDF
            </button>
          </div>

          <div
            ref={printRef}
            className="rounded-2xl border border-gray-100 shadow-sm overflow-auto bg-gray-100"
            style={{ maxHeight: "calc(100vh - 160px)" }}
          >
            {/* Gray surround — like a real print preview */}
            <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
              <div style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
                <ContractDocument data={formValues} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
