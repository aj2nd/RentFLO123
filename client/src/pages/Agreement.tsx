import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { CheckCircle, FileText, ExternalLink, Clock, Download, Send } from "lucide-react";
import type { Property, Agreement } from "@shared/schema";

type AgreementData = { property: Property | null; agreement: Agreement | null };

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery<AgreementData>({
    queryKey: ["/api/agreements/mine"],
  });

  // Handle redirect back from Leegality after signing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("esign") === "done") {
      window.history.replaceState({}, "", "/agreement");
      toast({ title: "E-sign complete", description: "Your signature has been submitted. Agreement will update shortly." });
      const interval = setInterval(() => {
        refetch();
      }, 3000);
      setTimeout(() => clearInterval(interval), 30000);
    }
  }, []);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agreements/leegality/send");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send for e-sign");
      }
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements/mine"] });
      if (result.alreadySent) {
        toast({ title: "Already sent", description: "Your agreement is already out for e-signing." });
        return;
      }
      const signingUrl = result.inviteeLinks?.[0]?.signingUrl;
      if (signingUrl) {
        toast({ title: "Agreement sent!", description: "Opening Leegality e-sign now\u2026" });
        window.location.assign(signingUrl);
      } else {
        toast({ title: "Agreement sent!", description: "You'll receive a signing link on your registered email/phone." });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    },
  });

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledToBottom(true);
    }
  };

  const leegalitySent = !!(data?.agreement?.leegalityDocumentId);
  const leegalityDone = !!(data?.agreement?.leegalityCompletedAt);
  const alreadySigned = leegalityDone ||
    (data?.agreement &&
      ((user?.role === "OWNER" && data.agreement.ownerSignatureUrl) ||
        (user?.role === "TENANT" && data.agreement.tenantSignatureUrl)));

  const dashboardPath = user?.role === "OWNER" ? "/owner" : "/tenant";
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "User";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 p-5 sm:p-8 md:p-10 pb-24 max-w-2xl w-full mx-0">

          {/* Header */}
          <div className="mb-8 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#6FFFE9]/35 mb-4">
              <FileText size={13} className="text-[#6FFFE9]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9DEFE4]">{t("agr_badge")}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1 text-[#6FFFE9]"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              {t("agr_title")}
            </h1>
            <p className="text-[#9DEFE4] text-sm sm:text-base">
              {t("agr_subtitle_leegality")}
            </p>
          </div>

          {/* No property */}
          {!data?.property && (
            <div className="border border-[#6FFFE9]/35 p-6 text-[#9DEFE4] text-sm">
              {t("agr_no_property")}
              <Button
                className="mt-4 h-10 bg-[#6FFFE9] text-black hover:bg-[#6FFFE9]/85 font-bold rounded-none block"
                onClick={() => setLocation("/setup")}
              >
                {t("agr_go_to_setup")}
              </Button>
            </div>
          )}

          {/* Already signed / success */}
          {alreadySigned && data?.property && (
            <div className="border-2 border-[#6FFFE9] p-6 sm:p-8 space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-10 h-10 text-[#6FFFE9] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-bold text-[#6FFFE9]">{t("agr_signed_title")}</h2>
                  <p className="text-[#9DEFE4] text-sm mt-1">
                    {t("agr_signed_desc")}
                    {data.agreement?.status === "FULLY_SIGNED"
                      ? " " + t("agr_both_signed")
                      : " " + t("agr_waiting_other")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 h-12 bg-[#6FFFE9] text-black hover:bg-[#6FFFE9]/85 font-bold rounded-none"
                  onClick={() => setLocation(dashboardPath)}
                  data-testid="button-go-to-dashboard"
                >
                  {t("agr_go_to_dashboard")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-[#6FFFE9]/30 text-[#6FFFE9] hover:bg-[#6FFFE9]/10 rounded-none bg-transparent font-semibold"
                  onClick={() => {
                    const win = window.open("", "_blank", "width=700,height=900");
                    if (!win) return;
                    const signedDate = data.agreement?.tenantSignedAt
                      ? new Date(data.agreement.tenantSignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
                    win.document.write(`<!DOCTYPE html><html><head><title>RentFLO Agreement — ${escapeHtml(data.property!.address)}</title>
                      <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#e4e4e7;font-family:Inter,sans-serif;padding:48px 40px;font-size:14px;line-height:1.7}
                      .brand{font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:2px}.brand span{color:#6FFFE9}
                      .badge{display:inline-block;border:1px solid rgba(111,255,233,0.35);color:#6FFFE9;font-size:11px;text-transform:uppercase;letter-spacing:3px;padding:4px 12px;margin-bottom:32px}
                      h1{font-size:24px;font-weight:700;color:#6FFFE9;margin-bottom:8px}
                      h2{font-size:16px;font-weight:600;margin:24px 0 8px;color:#fff}
                      p,li{color:#a1a1aa;font-size:13px;margin-bottom:8px}ul{padding-left:20px;margin-bottom:8px}
                      .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0;padding:20px;border:1px solid rgba(111,255,233,0.2)}
                      .meta-item .label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#52525b;margin-bottom:2px}
                      .meta-item .value{font-size:14px;font-weight:600;color:#fff}
                      .sig-box{border:1px solid rgba(111,255,233,0.3);padding:20px;margin-top:32px}
                      .sig-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#52525b;margin-bottom:8px}
                      hr{border:none;border-top:1px solid rgba(111,255,233,0.15);margin:24px 0}
                      .footer{margin-top:48px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#3f3f46;text-align:center}
                      </style></head><body>
                      <div class="brand">Rent<span>FLO</span></div>
                      <div class="badge">Tripartite Rent Advance Agreement</div>
                      <h1>Rental Agreement</h1>
                      <p>This agreement is entered into between the Owner, RentFLO Technologies Pvt. Ltd. (Platform), and the Tenant.</p>
                      <div class="meta">
                        <div class="meta-item"><div class="label">Property</div><div class="value">${escapeHtml(data.property!.address)}</div></div>
                        <div class="meta-item"><div class="label">Monthly Rent</div><div class="value">₹${escapeHtml(data.property!.monthlyRent.toLocaleString())}</div></div>
                        <div class="meta-item"><div class="label">Payout Day</div><div class="value">${escapeHtml(String(data.property!.payoutDay))}${["st","nd","rd"][data.property!.payoutDay-1]||"th"} of Month</div></div>
                        <div class="meta-item"><div class="label">Signed On</div><div class="value">${escapeHtml(signedDate)}</div></div>
                        <div class="meta-item"><div class="label">Agreement Status</div><div class="value">${escapeHtml(data.agreement?.status ?? "SIGNED")}</div></div>
                        <div class="meta-item"><div class="label">Tenant</div><div class="value">${escapeHtml(userName)}</div></div>
                      </div>
                      <hr/>
                      <h2>1. Rent Advance</h2><p>RentFLO advances the monthly rent to the Owner on the agreed payout day regardless of whether the Tenant has paid. The Tenant is then obligated to reimburse RentFLO by the same date each month.</p>
                      <h2>2. Tenant Obligations</h2><ul><li>Pay the monthly rent to RentFLO on or before the payout day.</li><li>Maintain the property in good condition.</li><li>Report maintenance issues promptly via the RentFLO platform.</li></ul>
                      <h2>3. Owner Obligations</h2><ul><li>Ensure the property is habitable and meets legal standards.</li><li>Respond to maintenance requests within a reasonable time.</li></ul>
                      <h2>4. Governing Law</h2><p>This Agreement is governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>
                      <div class="sig-box">
                        <div class="sig-label">Digital Signature — ${escapeHtml(userName)}</div>
                        <p style="color:#6FFFE9;font-size:13px;">✓ Digitally signed on ${escapeHtml(signedDate)} via RentFLO Platform</p>
                      </div>
                      <div class="footer">rentflo.com · This is a legally binding digital agreement · Keep for your records</div>
                      </body></html>`);
                    win.document.close();
                    win.focus();
                    setTimeout(() => win.print(), 400);
                  }}
                  data-testid="button-download-agreement"
                >
                  <Download size={15} className="mr-2" />
                  {t("agr_download_pdf")}
                </Button>
              </div>
            </div>
          )}

          {/* Agreement text + Leegality e-sign */}
          {!alreadySigned && data?.property && (
            <div className="space-y-6">
              {/* Scrollable agreement text */}
              <div className="border border-[#6FFFE9]/28 bg-black">
                <div className="px-5 py-3 border-b border-[#6FFFE9]/20 flex items-center gap-2">
                  <FileText size={14} className="text-[#9DEFE4]" />
                  <span className="text-xs uppercase tracking-wider text-[#9DEFE4] font-semibold">
                    {t("agr_rent_advance")} — {data.property.address}
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
                    {t("agr_scroll_hint")}
                  </div>
                )}
              </div>

              {/* Leegality e-sign CTA */}
              {leegalitySent ? (
                <div className="border border-yellow-500/50 bg-yellow-500/5 p-5 sm:p-6 flex items-start gap-4">
                  <Clock className="w-9 h-9 text-yellow-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-yellow-400">{t("agr_awaiting_esign")}</h2>
                    <p className="text-zinc-400 text-sm mt-1">
                      {t("agr_esign_sent_desc")}
                    </p>
                    <p className="text-zinc-600 text-xs mt-2">
                      {t("agr_esign_auto_update")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-[#6FFFE9]/45 bg-[#6FFFE9]/[0.04] p-5 sm:p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#6FFFE9]/15 border border-[#6FFFE9]/30 shrink-0">
                      <Send size={18} className="text-[#6FFFE9]" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold uppercase tracking-wider text-[#9DEFE4]">
                        {t("agr_esign_via_leegality")}
                      </h2>
                      <p className="text-sm text-zinc-400 mt-1">
                        {t("agr_esign_read_desc")}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => sendMutation.mutate()}
                    disabled={sendMutation.isPending || !scrolledToBottom}
                    className="w-full h-12 rounded-none border-0 text-sm font-bold uppercase tracking-widest bg-[#6FFFE9] hover:bg-[#6FFFE9]/90 text-black flex items-center justify-center gap-2 disabled:opacity-40"
                    data-testid="button-leegality-send"
                  >
                    {sendMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black animate-spin" />
                        {t("agr_sending")}
                      </>
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        {scrolledToBottom ? t("agr_send_for_esign") : t("agr_scroll_first")}
                      </>
                    )}
                  </Button>

                  {/* Leegality branding */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.07] bg-white/[0.03]">
                      <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="24" height="24" rx="3" stroke="#22C55E" strokeWidth="3" fill="none" />
                        <path d="M10 16l4 4 8-8" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[11px] font-semibold tracking-wide text-zinc-300">Leegality</span>
                      <span className="text-[10px] text-zinc-600 ml-0.5">{t("agr_leegality_tagline")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Party status pills */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("agr_rentflo_party"), signed: true },
                  { label: t("agr_landlord_party"), signed: !!(data.agreement?.ownerSignatureUrl) || leegalityDone },
                  { label: t("agr_tenant_party"), signed: !!(data.agreement?.tenantSignatureUrl) || leegalityDone },
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
                      {s ? t("agr_signed_tick") : t("agr_pending")}
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
