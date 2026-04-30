"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import SignaturePad from "signature_pad";
import { ContractDocument } from "@/components/ContractDocument";
import { ContractLinkRecord, ContractSignature } from "@/lib/contract";
import { Download, RotateCcw, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function formatSignedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ─── Signature pad dialog ─────────────────────────────────────────────────────

function SignatureDialog({
  onConfirm,
  onClose,
}: {
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);
    padRef.current = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 3,
      penColor: "#111111",
    });
    const update = () => setIsEmpty(padRef.current?.isEmpty() ?? true);
    canvas.addEventListener("pointerup", update);
    return () => {
      canvas.removeEventListener("pointerup", update);
      padRef.current?.off();
      padRef.current = null;
    };
  }, []);

  const handleClear = () => {
    padRef.current?.clear();
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    onConfirm(padRef.current.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 text-sm">Draw your signature</p>
            <p className="text-xs text-gray-400 mt-0.5">Use your mouse or finger to sign in the box below</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none cursor-pointer">✕</button>
        </div>

        <div className="px-6 pt-5 pb-2">
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50" style={{ height: "160px" }}>
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "160px", display: "block", cursor: "crosshair", touchAction: "none" }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-center tracking-wide">Sign within the box above</p>
        </div>

        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} /> Clear
          </button>
          <button
            onClick={handleConfirm}
            disabled={isEmpty}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Check size={13} /> Confirm Signature
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageState = "loading" | "not_found" | "expired" | "pending" | "signed" | "error";

export default function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [state, setPageState] = useState<PageState>("loading");
  const [link, setLink] = useState<ContractLinkRecord | null>(null);
  const [clientSig, setClientSig] = useState<ContractSignature | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/contracts/public/${token}`)
      .then(async (res) => {
        if (!res.ok) { setPageState("not_found"); return; }
        const json = await res.json();
        const data: ContractLinkRecord = json.data;
        setLink(data);
        if (data.status === "expired") {
          setPageState("expired");
        } else if (data.status === "signed" && data.clientSignature && data.signedAt) {
          setClientSig({ dataUrl: data.clientSignature, signedAt: formatSignedAt(data.signedAt) });
          setPageState("signed");
        } else {
          setPageState("pending");
        }
      })
      .catch(() => setPageState("error"));
  }, [token]);

  const handleSignatureConfirmed = useCallback(async (dataUrl: string) => {
    setPadOpen(false);
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/contracts/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Failed to submit signature. Please try again.");
        setSubmitting(false);
        return;
      }
      const json = await res.json();
      const updated: ContractLinkRecord = json.data;
      setLink(updated);
      const sig: ContractSignature = {
        dataUrl,
        signedAt: formatSignedAt(updated.signedAt!),
      };
      setClientSig(sig);
      setPageState("signed");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [token]);

  const handleDownload = () => {
    const content = document.getElementById("contract-print");
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html>
        <head>
          <title>Signed Contract – ${link?.clientName ?? ""}</title>
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

  // ── State screens ────────────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (state === "not_found" || state === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-4">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-bold text-gray-900 mb-2">Contract not found</p>
          <p className="text-sm text-gray-500">This link may be invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm mx-4">
          <div className="text-4xl mb-4">⏰</div>
          <p className="font-bold text-gray-900 mb-2">Link expired</p>
          <p className="text-sm text-gray-500">This contract link has expired. Please contact RestoRefine Studios for a new link.</p>
        </div>
      </div>
    );
  }

  if (!link) return null;

  // ── Contract view (pending or signed) ────────────────────────────────────────

  const isSigned = state === "signed";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoV3-black.svg" alt="RestoRefine" className="h-7 w-7 object-contain" />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">RestoRefine Studios</p>
              <p className="text-[10px] text-gray-400 mt-0.5">12-Week Sprint Agreement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isSigned ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                  <Check size={11} /> Signed
                </span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Download size={12} /> Download PDF
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xs text-gray-400">Scroll down and click the signature box to sign</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signed success banner */}
      {isSigned && (
        <div className="bg-green-600 text-white text-center py-3 px-4">
          <p className="text-sm font-semibold">
            ✓ Contract signed successfully — {clientSig?.signedAt}
          </p>
          <p className="text-xs text-green-100 mt-0.5">Download your copy using the button above</p>
        </div>
      )}

      {/* Contract document */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <ContractDocument
              data={link.contractData}
              signatures={clientSig ? { client: clientSig } : undefined}
              onClientSignatureClick={!isSigned && !submitting ? () => setPadOpen(true) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Bottom CTA for pending */}
      {!isSigned && !submitting && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Ready to sign? Click the <strong>signature box</strong> on page 3 of the contract above.
            </p>
            <button
              onClick={() => setPadOpen(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Sign Contract
            </button>
          </div>
        </div>
      )}

      {padOpen && (
        <SignatureDialog
          onConfirm={handleSignatureConfirmed}
          onClose={() => setPadOpen(false)}
        />
      )}
    </div>
  );
}
