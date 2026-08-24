/**
 * Design: Nightfall Waterfront Payment Journey.
 * This checkout control supports the compact violet confirmation treatment used
 * by the tenant dashboard while preserving the established UPI and proof flow.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, QrCode, Loader2, CheckCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n";

const SILVER_BTN = {
  background: "linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)",
  color: "#000",
};

type PayRentButtonProps = {
  amount: number;
  vpa: string;
  ledgerId?: string;
  presentation?: "standard" | "dashboard" | "image-overlay";
  buttonLabel?: string;
  buttonClassName?: string;
  ariaLabel?: string;
  dueDate?: string;
};

export function PayRentButton({
  amount,
  vpa,
  ledgerId,
  presentation = "standard",
  buttonLabel = "Pay Rent",
  buttonClassName = "",
  ariaLabel,
  dueDate,
}: PayRentButtonProps) {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const fallbackTimer = useRef<number | null>(null);
  const { toast } = useToast();

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({ pa: vpa, pn: "Rentflo", am: String(amount), cu: "INR", tn: dueDate ? `RentPayment Due ${dueDate}` : "RentPayment" });
    return `upi://pay?${params.toString()}`;
  }, [amount, dueDate, vpa]);

  useEffect(() => {
    const saved = sessionStorage.getItem("rentflo-payrent-processing");
    if (saved === "1") {
      sessionStorage.removeItem("rentflo-payrent-processing");
      setIsProcessing(false);
      setShowFallback(false);
      if (ledgerId) setShowProofForm(true);
    }
  }, [ledgerId]);

  const submitProof = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/ledgers/${ledgerId}/submit-payment-proof`, {
        amount,
        transactionRef: utr.trim(),
        proofScreenshotUrl: proofUrl.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Submitted for verification",
        description: "Our team will verify your payment shortly. You'll be notified when it's confirmed.",
      });
      setShowProofForm(false);
      setUtr("");
      setProofUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledgers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledgers/mine"] });
    },
    onError: (err: Error) => toast({ title: "Submission failed", description: err.message, variant: "destructive" }),
  });

  const handlePayRent = () => {
    if (amount <= 0) {
      toast({ title: "Enter an amount", description: "Amount must be greater than zero.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setShowFallback(false);
    sessionStorage.setItem("rentflo-payrent-processing", "1");
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    const opened = window.open(upiLink, "_self");
    fallbackTimer.current = window.setTimeout(() => {
      if (!opened || opened.closed) navigator.clipboard.writeText(upiLink).catch(() => {});
      setShowFallback(true);
      setIsProcessing(false);
      if (ledgerId) setShowProofForm(true);
    }, 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vpa);
      setCopied(true);
      toast({ title: "UPI ID copied", description: vpa });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the UPI ID manually.", variant: "destructive" });
    }
  };

  const handleShowQr = () => {
    const qrUrl = `/api/payments/upi-qr?data=${encodeURIComponent(upiLink)}`;
    window.open(qrUrl, "_blank", "noopener,noreferrer");
  };

  const utrValid = /^[A-Za-z0-9]{6,30}$/.test(utr.trim());
  const dashboardPresentation = presentation === "dashboard";
  const imageOverlayPresentation = presentation === "image-overlay";

  return (
    <div className={imageOverlayPresentation ? "h-full w-full" : dashboardPresentation ? "space-y-3" : "space-y-4"}>
      <Button
        type="button"
        onClick={handlePayRent}
        disabled={isProcessing || amount <= 0}
        aria-label={ariaLabel ?? buttonLabel}
        className={imageOverlayPresentation
          ? `h-full w-full border-0 bg-transparent p-0 text-transparent shadow-none hover:bg-transparent focus-visible:ring-2 focus-visible:ring-violet-300 ${buttonClassName}`
          : dashboardPresentation
          ? `h-[68px] w-full rounded-2xl border border-violet-300/30 bg-gradient-to-r from-[#6636da] via-[#8253ea] to-[#7140dd] text-base font-semibold text-white shadow-[0_14px_30px_rgba(99,57,218,0.34)] transition-transform duration-150 active:scale-[0.98] hover:brightness-110 ${buttonClassName}`
          : `w-full h-14 rounded-none border-0 ${buttonClassName}`}
        style={dashboardPresentation || imageOverlayPresentation ? undefined : SILVER_BTN}
        data-testid="button-pay-rent"
      >
        {isProcessing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing</>
        ) : imageOverlayPresentation ? (
          <span className="sr-only">{buttonLabel}</span>
        ) : dashboardPresentation ? (
          <span className="flex flex-col items-center leading-tight">
            <span className="flex items-center gap-2"><LockKeyhole className="h-4 w-4" />{buttonLabel}</span>
            <span className="mt-1 text-[10px] font-medium text-violet-100/75">100% Secure Payment</span>
          </span>
        ) : buttonLabel}
      </Button>

      {presentation === "standard" && (
        <div className="flex items-center justify-between gap-3 rounded-none border border-white/10 bg-black px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Or pay via UPI ID</p>
            <p className="truncate font-mono text-sm text-white" data-testid="text-upi-id">{vpa}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" onClick={handleCopy} className="rounded-none border-[#6FFFE9]/20 text-zinc-300 hover:border-[#6FFFE9]/40 hover:bg-white/5" data-testid="button-copy-upi">
              <Copy className="mr-2 h-4 w-4" />{copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" variant="outline" className="rounded-none border-[#6FFFE9]/20 text-zinc-300 hover:border-[#6FFFE9]/40 hover:bg-white/5" data-testid="button-show-qr" onClick={handleShowQr}>
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {showFallback && (
        <div className={dashboardPresentation ? "rounded-xl border border-violet-300/15 bg-white/[0.045] px-3 py-2 text-center text-xs text-slate-300" : "text-xs text-zinc-500"} data-testid="text-upi-fallback">
          If your UPI app did not open, use <button type="button" onClick={handleCopy} className="font-semibold text-violet-300 underline underline-offset-2">{copied ? "UPI ID copied" : "this UPI ID"}</button> to pay ₹{amount.toLocaleString("en-IN")}.
        </div>
      )}

      {showProofForm && ledgerId && (
        <div className={dashboardPresentation ? "space-y-4 rounded-2xl border border-violet-300/25 bg-[#101b2d]/95 p-4" : "space-y-4 rounded-2xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/[0.04] p-5"} data-testid="form-payment-proof">
          <div className="flex items-start gap-3">
            <CheckCircle className={dashboardPresentation ? "mt-0.5 h-5 w-5 shrink-0 text-violet-300" : "mt-0.5 h-5 w-5 shrink-0 text-[#6FFFE9]"} />
            <div>
              <p className="text-sm font-semibold text-white">{t("pay_rent_did_complete")}</p>
              <p className="mt-1 text-xs text-slate-400">Enter the UPI transaction ID so we can verify your payment.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">UPI Transaction ID (UTR)</label>
            <Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="e.g. 412345678901" className="border-white/10 bg-black/30 font-mono text-white" maxLength={30} data-testid="input-utr" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Screenshot URL (optional)</label>
            <Input value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://..." className="border-white/10 bg-black/30 text-white" data-testid="input-proof-url" />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => submitProof.mutate()} disabled={!utrValid || submitProof.isPending} className={dashboardPresentation ? "flex-1 rounded-xl bg-violet-600 text-white hover:bg-violet-500" : "flex-1 h-12 rounded-none border-0"} style={dashboardPresentation ? undefined : SILVER_BTN} data-testid="button-submit-proof">
              {submitProof.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting</> : "Submit for Verification"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowProofForm(false)} className="border-white/10 text-slate-300 hover:bg-white/5" data-testid="button-cancel-proof">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
