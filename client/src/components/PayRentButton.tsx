import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, QrCode, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/hooks/use-i18n";

const SILVER_BTN = {
  background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)',
  color: '#000',
};

type PayRentButtonProps = { amount: number; vpa: string; ledgerId?: string };

export function PayRentButton({ amount, vpa, ledgerId }: PayRentButtonProps) {
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
    const params = new URLSearchParams({ pa: vpa, pn: "Rentflo", am: String(amount), cu: "INR", tn: "RentPayment" });
    return `upi://pay?${params.toString()}`;
  }, [amount, vpa]);

  useEffect(() => {
    const saved = sessionStorage.getItem("rentflo-payrent-processing");
    if (saved === "1") {
      sessionStorage.removeItem("rentflo-payrent-processing");
      setIsProcessing(false);
      setShowFallback(false);
      // User came back from UPI app — prompt for proof.
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
    onError: (err: Error) => {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    },
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
      // If we never left the page (desktop / no UPI app), still let them submit proof.
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

  const utrValid = /^[A-Za-z0-9]{6,30}$/.test(utr.trim());

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handlePayRent}
        disabled={isProcessing}
        className="w-full h-14 rounded-none border-0"
        style={SILVER_BTN}
        data-testid="button-pay-rent"
      >
        {isProcessing ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing</>
        ) : (
          "Pay Rent"
        )}
      </Button>

      {/* Manual UPI ID — always available to copy & paste into any UPI app */}
      <div className="flex items-center justify-between gap-3 rounded-none border border-white/10 bg-black px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Or pay via UPI ID</p>
          <p className="text-sm text-white font-mono truncate" data-testid="text-upi-id">{vpa}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="rounded-none border-[#6FFFE9]/20 text-zinc-300 hover:bg-white/5 hover:border-[#6FFFE9]/40"
            data-testid="button-copy-upi"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-none border-[#6FFFE9]/20 text-zinc-300 hover:bg-white/5 hover:border-[#6FFFE9]/40"
            data-testid="button-show-qr"
            onClick={() => {
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;
              window.open(qrUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showFallback && (
        <p className="text-xs text-zinc-500" data-testid="text-upi-fallback">
          If your UPI app didn't open, copy the UPI ID above or scan the QR to pay ₹{amount.toLocaleString("en-IN")}.
        </p>
      )}

      {showProofForm && ledgerId && (
        <div className="rounded-2xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/[0.04] p-5 space-y-4" data-testid="form-payment-proof">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-[#6FFFE9] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">{t("pay_rent_did_complete")}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Enter the UPI transaction ID (UTR) so we can verify it against our bank statement.
                You'll find it in your UPI app's transaction history.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500">UPI Transaction ID (UTR)</label>
            <Input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 412345678901"
              className="bg-black/40 border-white/10 text-white font-mono"
              maxLength={30}
              data-testid="input-utr"
            />
            <p className="text-[10px] text-zinc-600">12-digit reference shown in your bank/UPI app.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500">Screenshot URL (optional)</label>
            <Input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="bg-black/40 border-white/10 text-white"
              data-testid="input-proof-url"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => submitProof.mutate()}
              disabled={!utrValid || submitProof.isPending}
              className="flex-1 h-12 rounded-none border-0"
              style={SILVER_BTN}
              data-testid="button-submit-proof"
            >
              {submitProof.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting</>
              ) : (
                "Submit for Verification"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProofForm(false)}
              className="rounded-none border-white/10 text-zinc-400 hover:bg-white/5"
              data-testid="button-cancel-proof"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
