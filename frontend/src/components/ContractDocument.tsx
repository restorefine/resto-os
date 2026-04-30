"use client";

import React from "react";
import { ContractFormData, ContractSignatures } from "@/lib/contract";

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

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px", pageBreakInside: "avoid", breakInside: "avoid" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #ddd", paddingBottom: "4px", marginBottom: "8px" }}>
        <span style={{ fontWeight: "900", fontSize: "13px" }}>{n}.&nbsp; {title}</span>
      </div>
      <div style={{ fontSize: "12px" }}>{children}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContractDocumentProps {
  data: ContractFormData;
  signatures?: ContractSignatures;
  onClientSignatureClick?: () => void;
  printId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContractDocument({ data, signatures, onClientSignatureClick, printId = "contract-print" }: ContractDocumentProps) {
  const startDate = new Date(data.startDate);
  const endDate = addWeeks(data.startDate, 12);
  const sprintLabel = `${fmtShort(startDate)} – ${fmtShort(endDate)}`;

  const pageStyle: React.CSSProperties = { padding: "18mm 18mm 18mm" };

  return (
    <div
      id={printId}
      className="bg-white text-[#111] font-[Arial,sans-serif] text-[12px] leading-[1.55]"
      style={{ width: "210mm" }}
    >
      {/* ══ PAGE 1 ══ */}
      <div style={pageStyle}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "14px", borderBottom: "2px solid #111" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoV3-black.svg" alt="R" style={{ width: "52px", height: "52px", objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "-0.02em", lineHeight: 1 }}>RestoRefine Studios</div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "4px", lineHeight: "1.5" }}>
                24 Fairley Street, Glasgow, G51 2SN<br />0141 266 0065
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: "#d01414", color: "#fff", padding: "10px 16px", textAlign: "right", minWidth: "170px" }}>
            <div style={{ fontSize: "13px", fontWeight: "900", letterSpacing: "0.05em", textTransform: "uppercase" }}>12-WEEK SPRINT</div>
            <div style={{ fontSize: "11px", marginTop: "2px", fontWeight: "500" }}>{sprintLabel}</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Social Media Growth Sprint Agreement
          </div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>
            Service Agreement between RestoRefine Studios and {data.clientCompany || data.clientName}
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginBottom: "16px", border: "1px solid #ddd" }}>
          <div style={{ padding: "12px 14px", borderRight: "1px solid #ddd" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Service Provider</div>
            <div style={{ fontWeight: "900", fontSize: "13px" }}>RestoRefine LTD</div>
            <div style={{ color: "#555", fontSize: "11px", marginTop: "2px" }}>{`("RestoRefine Studios")`}</div>
            <div style={{ color: "#555", fontSize: "11px", marginTop: "4px", lineHeight: "1.5" }}>
              24 Fairley Street, Glasgow, G51 2SN<br />0141 266 0065
            </div>
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Client</div>
            <div style={{ fontWeight: "900", fontSize: "13px" }}>{data.clientName}</div>
            {data.clientCompany && <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{data.clientCompany}</div>}
            <div style={{ fontSize: "11px", color: "#555", marginTop: "4px", lineHeight: "1.6" }}>
              {data.clientAddress && <>{data.clientAddress}<br /></>}{data.clientPhone}
            </div>
          </div>
        </div>

        {/* Intro */}
        <p style={{ marginBottom: "14px", fontSize: "12px" }}>
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
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px", fontSize: "12px" }}>
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
              <div style={{ fontWeight: "700", fontSize: "12px", marginTop: "4px" }}>Short-Form Video Contents</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: "32px", fontWeight: "900", lineHeight: 1 }}>{data.photoCount}</div>
              <div style={{ fontWeight: "700", fontSize: "12px", marginTop: "4px" }}>Photo / Graphic Posts</div>
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

      {/* Page divider (hidden on print) */}
      <div className="preview-page-break" style={{ height: "24px", background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>Page 2</span>
      </div>

      {/* ══ PAGE 2 ══ */}
      <div style={{ ...pageStyle, pageBreakBefore: "always", breakBefore: "page" }}>
        {/* §4 */}
        <Section n="4" title="Payment Terms">
          <div style={{ backgroundColor: "#d01414", color: "#fff", textAlign: "center", padding: "12px", fontSize: "13px" }}>
            Total Sprint Investment:&nbsp;<span style={{ fontSize: "22px", fontWeight: "900" }}>{fmtGBP(data.totalInvestment)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #ddd", marginBottom: "12px" }}>
            <div style={{ padding: "12px 16px", borderRight: "1px solid #ddd" }}>
              <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "3px" }}>Payment 1 – Due on signing</div>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#d01414" }}>{fmtGBP(data.payment1)}</div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "3px" }}>Payment 2 – After first shoot</div>
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

      {/* Page divider (hidden on print) */}
      <div className="preview-page-break" style={{ height: "24px", background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>Page 3</span>
      </div>

      {/* ══ PAGE 3 ══ */}
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
          <div style={{ backgroundColor: "#111", color: "#fff", textAlign: "center", padding: "10px", fontWeight: "900", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>
            Agreement &amp; Signatures
          </div>
          <p style={{ marginBottom: "16px", fontSize: "12px" }}>
            By signing below, both parties confirm they have read this Agreement in full, understand its terms, and agree to be legally bound by it.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #ddd" }}>
            {/* Client signature box */}
            <div style={{ padding: "14px 16px", borderRight: "1px solid #ddd" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Client</div>
              <div style={{ fontWeight: "900", fontSize: "13px" }}>{data.clientName}</div>
              {data.clientCompany && <div style={{ fontSize: "11px", color: "#555" }}>{data.clientCompany}</div>}

              {signatures?.client ? (
                <div style={{ marginTop: "10px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signatures.client.dataUrl}
                    alt="Client signature"
                    style={{ width: "100%", maxHeight: "72px", objectFit: "contain", objectPosition: "left" }}
                  />
                  <div style={{ borderTop: "1px solid #aaa", paddingTop: "5px", marginTop: "6px", fontSize: "10px", color: "#444" }}>
                    Signed digitally on {signatures.client.signedAt}
                  </div>
                </div>
              ) : onClientSignatureClick ? (
                <div
                  onClick={onClientSignatureClick}
                  style={{
                    marginTop: "12px",
                    border: "1.5px dashed #d01414",
                    padding: "14px 10px",
                    cursor: "pointer",
                    textAlign: "center",
                    color: "#d01414",
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.05em",
                    userSelect: "none",
                  }}
                >
                  Click here to sign
                </div>
              ) : (
                <>
                  <div style={{ marginTop: "40px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "10px", color: "#888" }}>Signature</div>
                  <div style={{ marginTop: "28px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "10px", color: "#888" }}>Date</div>
                </>
              )}
            </div>

            {/* Service Provider signature box */}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#d01414", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Service Provider</div>
              <div style={{ fontWeight: "900", fontSize: "13px" }}>Harpreet Singh</div>
              <div style={{ fontSize: "11px", color: "#555" }}>RestoRefine Studios Ltd</div>
              <div style={{ marginTop: "40px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "10px", color: "#888" }}>Signature</div>
              <div style={{ marginTop: "28px", borderTop: "1px solid #aaa", paddingTop: "4px", fontSize: "10px", color: "#888" }}>Date</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "18px", textAlign: "center", fontSize: "10px", color: "#888", borderTop: "1px solid #e5e5e5", paddingTop: "10px" }}>
          RestoRefine Studios Ltd &middot; 24 Fairley Street, Glasgow, G51 2SN &middot; 0141 266 0065<br />
          Social Media Growth Sprint &middot; {data.clientCompany || data.clientName} &middot; {fmtShort(startDate)} – {fmtShort(endDate)}
        </div>
      </div>
    </div>
  );
}

export default ContractDocument;
