"use client";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClients } from "@/hooks/useClients";
import { useContractLinks, useShareContract, useDeleteContractLink } from "@/hooks/useContractLinks";
import { Client } from "@/lib/types";
import { contractSchema, ContractFormData, ContractLinkRecord } from "@/lib/contract";
import { ContractDocument } from "@/components/ContractDocument";
import { cn } from "@/lib/utils";
import { Download, Share2, Copy, Check, Trash2, ExternalLink, FileDown } from "lucide-react";
import { toast } from "sonner";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-900 bg-white";

// ─── Share modal ──────────────────────────────────────────────────────────────

function ShareModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="mb-1 flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm">Contract link created</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Share this link with the client. It expires in 7 days.</p>

        <div className="flex items-stretch gap-2 mb-4">
          <input
            readOnly
            value={url}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 focus:outline-none"
            onFocus={e => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer",
              copied ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:bg-gray-700"
            )}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
        >
          <ExternalLink size={12} /> Preview signing page
        </a>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContractLinkRecord["status"] }) {
  const map = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    signed:  "bg-green-50 text-green-700 border-green-200",
    expired: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", map[status])}>
      {status}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const { data: clients = [] } = useClients();
  const { data: links = [] } = useContractLinks();
  const shareMutation = useShareContract();
  const deleteMutation = useDeleteContractLink();
  const printRef = useRef<HTMLDivElement>(null);
  const scaleWrapRef = useRef<HTMLDivElement>(null);
  const [docScale, setDocScale] = useState(1);

  useEffect(() => {
    const el = scaleWrapRef.current;
    if (!el) return;
    const calc = () => setDocScale(Math.min(1, el.clientWidth / 794));
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [shareModal, setShareModal] = useState<{ open: boolean; url: string }>({ open: false, url: "" });
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [downloadLink, setDownloadLink] = useState<(typeof links)[0] | null>(null);

  useEffect(() => {
    if (!downloadLink) return;
    const content = document.getElementById("link-contract-print");
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html>
        <head>
          <title>Contract – ${downloadLink.clientName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            body { font-family: Arial, sans-serif; background: white; }
            @page { margin: 0; size: A4; }
            #link-contract-print { padding: 0 !important; width: 100% !important; }
            .preview-page-break { display: none !important; }
          </style>
        </head>
        <body>${content.outerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
    setDownloadLink(null);
  }, [downloadLink]);

  const { register, watch, setValue, formState: { errors } } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      videoCount: 18,
      photoCount: 10,
      totalInvestment: 1600,
      payment1: 1000,
      payment2: 600,
    },
  });

  const formValues = watch();
  const canShare = !!(formValues.clientName && formValues.clientCompany && formValues.startDate);

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
      <!DOCTYPE html><html>
        <head>
          <title>Contract – ${formValues.clientName ?? ""}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            body { font-family: Arial, sans-serif; background: white; }
            @page { margin: 0; size: A4; }
            #contract-print { padding: 0 !important; width: 100% !important; }
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

  const handleShare = async () => {
    try {
      const link = await shareMutation.mutateAsync(formValues);
      const url = `${window.location.origin}/sign/${link.token}`;
      setShareModal({ open: true, url });
    } catch {
      toast.error("Failed to create share link. Please try again.");
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Link deleted");
    } catch {
      toast.error("Failed to delete link");
    }
  };

  return (
    <div className="max-w-[1400px]">
      <PageHeader title="Contract Generator" subtitle="Generate and share client contracts" />

      {/* Mobile tab switcher */}
      <div className="flex items-center gap-2 mb-4 xl:hidden">
        <div className="flex-1 flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              mobileTab === "form"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            )}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              mobileTab === "preview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            )}
          >
            Preview
          </button>
        </div>
        {mobileTab === "preview" && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              disabled={!canShare || shareMutation.isPending}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Share2 size={12} />
              {shareMutation.isPending ? "..." : "Share"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Download size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">

        {/* ── Form ────────────────────────────────────────────────── */}
        <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden", mobileTab !== "form" && "hidden xl:block")}>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-[10px] tracking-[0.18em] uppercase font-semibold text-gray-400">Contract Details</p>
          </div>

          <form className="px-5 py-5 space-y-5">
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Client</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Client</label>
                <select {...register("clientId")} onChange={handleClientChange} className={inp}>
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
                <textarea {...register("clientAddress")} rows={2} placeholder="46 Princes Street, Port Glasgow..." className={`${inp} resize-none`} />
                {errors.clientAddress && <p className="mt-1 text-xs text-red-500">{errors.clientAddress.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input {...register("clientPhone")} placeholder="+44 7599 064917" className={inp} />
                {errors.clientPhone && <p className="mt-1 text-xs text-red-500">{errors.clientPhone.message}</p>}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Sprint Timeline</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input {...register("startDate")} type="date" className={inp} />
                {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.14em] uppercase font-semibold text-gray-400">Scope of Services</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Short-Form Videos</label>
                  <input {...register("videoCount", { valueAsNumber: true })} type="number" min={1} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Photo / Graphic Posts</label>
                  <input {...register("photoCount", { valueAsNumber: true })} type="number" min={1} className={inp} />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

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
        <div className={cn(mobileTab !== "preview" && "hidden xl:block")}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">
              Live Preview
              {formValues.clientCompany || formValues.clientName
                ? <span className="text-gray-400 font-normal"> — {formValues.clientCompany || formValues.clientName}</span>
                : <span className="text-gray-400 font-normal text-xs"> · fill in the form to see changes</span>
              }
            </p>
            <div className="hidden xl:flex items-center gap-2">
              <button
                onClick={handleShare}
                disabled={!canShare || shareMutation.isPending}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                title={!canShare ? "Fill in client name, company and start date first" : ""}
              >
                <Share2 size={13} />
                {shareMutation.isPending ? "Creating..." : "Share"}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <Download size={13} /> Download PDF
              </button>
            </div>
          </div>

          <div
            ref={scaleWrapRef}
            className="rounded-2xl border border-gray-100 shadow-sm overflow-y-auto bg-gray-100"
            style={{ maxHeight: "calc(100vh - 160px)" }}
          >
            <div style={{ padding: "24px", display: "flex", justifyContent: "center" }}>
              <div
                ref={printRef}
                style={{ zoom: docScale, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", width: 794 }}
              >
                <ContractDocument data={formValues} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Shared Contracts status table ──────────────────────────── */}
      {links.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800">Shared Contracts</p>
            <p className="text-xs text-gray-400">{links.length} link{links.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Company</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Created</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Expires</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Signed</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800 text-xs">{link.clientName}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{link.clientCompany}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(link.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {new Date(link.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {link.signedAt
                        ? new Date(link.signedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={link.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setDownloadLink(link)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <FileDown size={13} />
                        </button>
                        <button
                          onClick={() => handleCopyLink(link.token)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Copy link"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete link"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden contract renderer for link downloads */}
      {downloadLink && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, width: 794, pointerEvents: "none" }}>
          <ContractDocument data={downloadLink.contractData} printId="link-contract-print" />
        </div>
      )}

      {/* Share modal */}
      {shareModal.open && (
        <ShareModal url={shareModal.url} onClose={() => setShareModal({ open: false, url: "" })} />
      )}
    </div>
  );
}
