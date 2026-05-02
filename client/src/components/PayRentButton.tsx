import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SILVER_BTN = {
  background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)',
  color: '#000',
};

type PayRentButtonProps = { amount: number; vpa: string };

export function PayRentButton({ amount, vpa }: PayRentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
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
    }
  }, []);

  const handlePayRent = () => {
    setIsProcessing(true);
    setShowFallback(false);
    sessionStorage.setItem("rentflo-payrent-processing", "1");
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    const opened = window.open(upiLink, "_self");
    fallbackTimer.current = window.setTimeout(() => {
      if (!opened || opened.closed) navigator.clipboard.writeText(upiLink).catch(() => {});
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

      {showFallback && (
        <div className="rounded-none border border-white/10 bg-black p-4 space-y-3">
          <p className="text-sm text-zinc-400" data-testid="text-upi-fallback">
            If the payment app did not open, use the options below.
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleCopy}
              className="flex-1 rounded-none border-0"
              style={SILVER_BTN}
              data-testid="button-copy-upi"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-none border-[#6FFFE9]/20 text-zinc-300 hover:bg-white/5 hover:border-[#6FFFE9]/40"
              data-testid="button-show-qr"
              onClick={() => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;
                window.open(qrUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Show QR
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
