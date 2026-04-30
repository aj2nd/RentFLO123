import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type PayRentButtonProps = {
  amount: number;
  vpa: string;
};

export function PayRentButton({ amount, vpa }: PayRentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const fallbackTimer = useRef<number | null>(null);
  const { toast } = useToast();

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: vpa,
      pn: "Rentflo",
      am: String(amount),
      cu: "INR",
      tn: "RentPayment",
    });
    return `upi://pay?${params.toString()}`;
  }, [amount, vpa]);

  useEffect(() => {
    const saved = sessionStorage.getItem("rentflo-payrent-processing");
    if (saved === "1") {
      sessionStorage.removeItem("rentflo-payrent-processing");
      setIsProcessing(false);
      setShowFallback(false);
    }
  }, []);

  const handlePayRent = () => {
    setIsProcessing(true);
    setShowFallback(false);
    sessionStorage.setItem("rentflo-payrent-processing", "1");
    if (fallbackTimer.current) {
      window.clearTimeout(fallbackTimer.current);
    }
    const intentLink = `intent://pay?${upiLink.split("?")[1]}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    window.location.assign(intentLink);
    fallbackTimer.current = window.setTimeout(() => {
      setShowFallback(true);
      setIsProcessing(false);
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

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handlePayRent}
        disabled={isProcessing}
        className="w-full h-14 rounded-none border border-[#6FFFE9]/30 bg-black text-[#6FFFE9] shadow-[0_8px_30px_rgba(111,255,233,0.08)] hover:bg-[#071312] hover:border-[#6FFFE9] transition-all"
        data-testid="button-pay-rent"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          "Pay Rent"
        )}
      </Button>

      {showFallback && (
        <div className="rounded-none border border-[#6FFFE9]/20 bg-black p-4 space-y-3">
          <p className="text-sm text-[#9DEFE4]" data-testid="text-upi-fallback">
            If the payment app did not open, use the options below.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-none bg-[#6FFFE9] text-black hover:bg-[#8CFFF0]"
              data-testid="button-copy-upi"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-none border-[#6FFFE9]/30 text-[#6FFFE9] hover:bg-[#6FFFE9]/10"
              data-testid="button-show-qr"
              onClick={() => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;
                window.open(qrUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <QrCode className="h-4 w-4" />
              Show QR
            </Button>
          </div>
        </div>
      )}

      <a href={upiLink} className="sr-only" aria-hidden="true" tabIndex={-1} data-testid="link-upi-direct">
        Open UPI
      </a>

      {/* Integrate backend S2S webhook verification here; deep links do not confirm payment automatically. */}
    </div>
  );
}