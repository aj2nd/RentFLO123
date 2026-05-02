import { useRef, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, FileText, PenLine, RotateCcw } from "lucide-react";
import type { Property, Agreement } from "@shared/schema";

type AgreementData = { property: Property | null; agreement: Agreement | null };

// ─── Canvas Signature Pad ───────────────────────────────────────────────────
function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e: MouseEvent | Touch, rect: DOMRect) => ({
    x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width),
    y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height),
  });

  const startDraw = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const pos = getPos({ clientX, clientY } as MouseEvent, rect);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((clientX: number, clientY: number) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const pos = getPos({ clientX, clientY } as MouseEvent, rect);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStrokes(true);
  }, []);

  const endDraw = useCallback(() => { drawing.current = false; }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#C8C8C8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const onMouseDown = (e: MouseEvent) => startDraw(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => draw(e.clientX, e.clientY);
    const onMouseUp = () => endDraw();
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); startDraw(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); draw(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = () => endDraw();

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [startDraw, draw, endDraw]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    // Export on black background
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    onSave(offscreen.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <div className="relative border border-[#6FFFE9]/30 bg-black touch-none">
        <canvas
          ref={canvasRef}
          width={700}
          height={180}
          className="w-full h-[140px] sm:h-[160px] cursor-crosshair block"
          data-testid="canvas-signature"
        />
        <div className="absolute inset-0 flex items-end pointer-events-none p-3">
          <span className="text-[#6FFFE9]/20 text-xs uppercase tracking-widest select-none">
            Draw your signature here
          </span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-2 px-4 py-2 border border-[#6FFFE9]/20 text-[#9DEFE4] text-sm hover:border-[#6FFFE9]/50 transition-colors"
          data-testid="button-clear-signature"
        >
          <RotateCcw size={14} />
          Clear
        </button>
        <Button
          type="button"
          onClick={save}
          disabled={!hasStrokes}
          className="flex-1 h-10 font-bold rounded-none disabled:opacity-30 border-0"
          style={{ background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)', color: '#000' }}
          data-testid="button-confirm-signature"
        >
          <PenLine size={15} className="mr-2" />
          Confirm Signature
        </Button>
      </div>
    </div>
  );
}

// ─── Agreement Text ─────────────────────────────────────────────────────────
function AgreementBody({ property, userName }: { property: Property; userName: string }) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="space-y-4 text-sm text-[#9DEFE4] leading-relaxed">
      <p>
        This <strong className="text-[#6FFFE9]">Tripartite Rent Advance Agreement</strong> ("Agreement") is entered
        into on <strong className="text-[#6FFFE9]">{date}</strong> between:
      </p>
      <ol className="list-decimal list-inside space-y-2 pl-2">
        <li><strong className="text-[#6FFFE9]">RentFLO Technologies Pvt. Ltd.</strong> — the Platform ("RentFLO");</li>
        <li><strong className="text-[#6FFFE9]">The Landlord (Owner)</strong> — the registered owner of the property at <em>{property.address}</em>; and</li>
        <li><strong className="text-[#6FFFE9]">The Tenant</strong> — the occupant of the above property.</li>
      </ol>

      <h3 className="text-[#6FFFE9] font-semibold mt-4 uppercase tracking-wider text-xs">1. Purpose</h3>
      <p>
        RentFLO advances the monthly rent of <strong className="text-[#6FFFE9]">₹{property.monthlyRent.toLocaleString("en-IN")}</strong> to
        the Landlord on or before the {property.payoutDay}{ordinal(property.payoutDay)} of each calendar month ("Payout Day"),
        regardless of whether the Tenant has yet remitted payment. The Tenant agrees to repay the same amount
        to RentFLO within the same calendar month, in one or more installments via the RentFLO platform.
      </p>

      <h3 className="text-[#6FFFE9] font-semibold uppercase tracking-wider text-xs">2. Landlord Obligations</h3>
      <p>
        The Landlord agrees to: (a) maintain the property in a habitable condition; (b) not seek rent directly
        from the Tenant for any month in which RentFLO has advanced funds; (c) repay to RentFLO any advanced
        amount in the event the tenancy is terminated before the Tenant repays.
      </p>

      <h3 className="text-[#6FFFE9] font-semibold uppercase tracking-wider text-xs">3. Tenant Obligations</h3>
      <p>
        The Tenant agrees to: (a) repay the advanced rent to RentFLO in full within the calendar month of
        advance; (b) not make any rent payments directly to the Landlord for months covered by this Agreement;
        (c) notify RentFLO immediately of any tenancy changes.
      </p>

      <h3 className="text-[#6FFFE9] font-semibold uppercase tracking-wider text-xs">4. Default</h3>
      <p>
        In the event the Tenant fails to repay within the stipulated period, RentFLO reserves the right to
        report the default to credit bureaus, initiate recovery proceedings, and suspend platform access.
        The Landlord is not liable for the Tenant's default to RentFLO.
      </p>

      <h3 className="text-[#6FFFE9] font-semibold uppercase tracking-wider text-xs">5. Digital Execution</h3>
      <p>
        The parties agree that a digital signature captured on the RentFLO platform constitutes a valid and
        legally binding signature under the Information Technology Act, 2000 (India). Each party's
        timestamp and signature are recorded immutably in the RentFLO ledger.
      </p>

      <h3 className="text-[#6FFFE9] font-semibold uppercase tracking-wider text-xs">6. Governing Law</h3>
      <p>
        This Agreement is governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction
        of courts in Mumbai, Maharashtra.
      </p>

      <p className="pt-2 border-t border-[#6FFFE9]/20 text-[#9DEFE4]/70 text-xs">
        By signing below, <strong>{userName}</strong>, you confirm that you have read, understood, and agree
        to be bound by all terms of this Agreement.
      </p>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AgreementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [signed, setSigned] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<AgreementData>({
    queryKey: ["/api/agreements/mine"],
  });

  const signMutation = useMutation({
    mutationFn: async (signatureUrl: string) => {
      if (!data?.property) throw new Error("No property found");
      const res = await apiRequest("POST", "/api/agreements/sign", {
        signatureUrl,
        propertyId: data.property.id,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to sign");
      }
      return res.json();
    },
    onSuccess: () => {
      setSigned(true);
      queryClient.invalidateQueries({ queryKey: ["/api/agreements/mine"] });
      toast({ title: "Agreement Signed", description: "Your digital signature has been recorded." });
    },
    onError: (e: Error) => {
      toast({ title: "Signing Failed", description: e.message, variant: "destructive" });
    },
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  const alreadySigned =
    data?.agreement &&
    ((user?.role === "OWNER" && data.agreement.ownerSignatureUrl) ||
      (user?.role === "TENANT" && data.agreement.tenantSignatureUrl));

  const dashboardPath = user?.role === "OWNER" ? "/owner" : "/tenant";
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "User";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200" style={{ fontFamily: "Inter, sans-serif" }}>
      <Navigation />

      <main className="pl-20 md:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 p-5 sm:p-8 md:p-10 max-w-2xl w-full mx-0">

          {/* Header */}
          <div className="mb-8 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#6FFFE9]/35 mb-4">
              <FileText size={13} className="text-[#6FFFE9]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9DEFE4]">Tripartite Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1 text-[#6FFFE9]"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Sign Your Agreement
            </h1>
            <p className="text-[#9DEFE4] text-sm sm:text-base">
              Read the full agreement below, then draw your signature to execute it digitally.
            </p>
          </div>

          {/* No property */}
          {!data?.property && (
            <div className="border border-[#6FFFE9]/35 p-6 text-[#9DEFE4] text-sm">
              No property found. Please complete your property setup first.
              <Button
                className="mt-4 h-10 bg-[#6FFFE9] text-black hover:bg-[#8CFFF0] font-bold rounded-none block"
                onClick={() => setLocation("/setup")}
              >
                Go to Setup
              </Button>
            </div>
          )}

          {/* Already signed / success */}
          {(signed || alreadySigned) && data?.property && (
            <div className="border-2 border-[#6FFFE9] p-6 sm:p-8 space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-10 h-10 text-[#6FFFE9] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-bold text-[#6FFFE9]">Agreement Signed</h2>
                  <p className="text-[#9DEFE4] text-sm mt-1">
                    Your digital signature has been recorded on the RentFLO ledger.
                    {data.agreement?.status === "FULLY_SIGNED"
                      ? " Both parties have signed — the agreement is fully executed."
                      : " Waiting for the other party to sign."}
                  </p>
                </div>
              </div>
              <Button
                className="w-full h-12 bg-[#6FFFE9] text-black hover:bg-[#8CFFF0] font-bold rounded-none"
                onClick={() => setLocation(dashboardPath)}
                data-testid="button-go-to-dashboard"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Agreement + signature form */}
          {!signed && !alreadySigned && data?.property && (
            <div className="space-y-6">
              {/* Scrollable agreement text */}
              <div className="border border-[#6FFFE9]/28 bg-black">
                <div className="px-5 py-3 border-b border-[#6FFFE9]/20 flex items-center gap-2">
                  <FileText size={14} className="text-[#9DEFE4]" />
                  <span className="text-xs uppercase tracking-wider text-[#9DEFE4] font-semibold">
                    Rent Advance Agreement — {data.property.address}
                  </span>
                </div>
                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="p-5 sm:p-6 overflow-y-auto max-h-[340px] sm:max-h-[420px]"
                  data-testid="div-agreement-text"
                >
                  <AgreementBody property={data.property} userName={userName} />
                </div>
                {!scrolledToBottom && (
                  <div className="px-5 py-2 border-t border-[#6FFFE9]/20 text-[#9DEFE4]/60 text-xs text-center">
                    ↓ Scroll to read the full agreement before signing
                  </div>
                )}
              </div>

              {/* Signature section */}
              <div className="border border-[#6FFFE9]/28 bg-black p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <PenLine size={15} className="text-[#9DEFE4]" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9DEFE4]">
                    Your Digital Signature — {userName}
                  </h2>
                </div>

                {!scrolledToBottom ? (
                  <div className="h-[140px] sm:h-[160px] border border-[#6FFFE9]/22 flex items-center justify-center text-[#9DEFE4]/50 text-sm text-center px-4">
                    Read the full agreement above to unlock the signature pad.
                  </div>
                ) : (
                  <SignaturePad onSave={(dataUrl) => signMutation.mutate(dataUrl)} />
                )}

                {signMutation.isPending && (
                  <p className="text-xs text-[#9DEFE4] animate-pulse">Recording your signature…</p>
                )}
              </div>

              {/* Party status pills */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "RentFLO", signed: true },
                  {
                    label: "Landlord",
                    signed: !!(data.agreement?.ownerSignatureUrl),
                  },
                  {
                    label: "Tenant",
                    signed: !!(data.agreement?.tenantSignatureUrl),
                  },
                ].map(({ label, signed: s }) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center justify-center p-3 border text-center ${
                      s ? "border-[#6FFFE9] bg-[#6FFFE9]/8" : "border-[#6FFFE9]/25"
                    }`}
                  >
                    <span className={`text-xs font-semibold uppercase tracking-wider ${s ? "text-[#6FFFE9]" : "text-[#9DEFE4]/50"}`}>
                      {label}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${s ? "text-[#6FFFE9]" : "text-[#9DEFE4]/30"}`}>
                      {s ? "✓ Signed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
