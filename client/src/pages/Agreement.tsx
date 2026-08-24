/** Design: Agreement preserves its legal content while using the RentFLO violet accent system. */
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { CheckCircle, FileText, Clock, Download, PenLine } from "lucide-react";
import type { Property, Agreement } from "@shared/schema";
import { appendDivider, appendTextElement, openPrintDocument } from "@/lib/print-document";

type AgreementData = { property: Property | null; agreement: Agreement | null };

const agreementPrintCss = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#000;color:#e4e4e7;font-family:Inter,sans-serif;padding:48px 40px;font-size:14px;line-height:1.7}
  .brand{font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:2px;color:#8B5CF6}
  .badge{display:inline-block;border:1px solid rgba(139,92,246,.35);color:#8B5CF6;font-size:11px;text-transform:uppercase;letter-spacing:3px;padding:4px 12px;margin-bottom:32px}
  h1{font-size:24px;font-weight:700;color:#8B5CF6;margin-bottom:8px}h2{font-size:16px;font-weight:600;margin:24px 0 8px;color:#fff}
  p,li{color:#a1a1aa;font-size:13px;margin-bottom:8px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0;padding:20px;border:1px solid rgba(139,92,246,.2)}
  .label{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#52525b;margin-bottom:2px}.value{font-size:14px;font-weight:600;color:#fff;overflow-wrap:anywhere}
  .sig-box{border:1px solid rgba(139,92,246,.3);padding:20px;margin-top:32px}.footer{margin-top:48px;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#3f3f46;text-align:center}
  .divider{border:none;border-top:1px solid rgba(139,92,246,.15);margin:24px 0}
`;

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── Agreement Text ─────────────────────────────────────────────────────────
function AgreementBody({ property, userName }: { property: Property; userName: string }) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="space-y-4 text-sm text-[#DDD6FE] leading-relaxed">
      <p>
        This <strong className="text-[#8B5CF6]">Tripartite Rent Advance Agreement</strong> ("Agreement") is entered
        into on <strong className="text-[#8B5CF6]">{date}</strong> between:
      </p>
      <ol className="list-decimal list-inside space-y-2 pl-2">
        <li><strong className="text-[#8B5CF6]">RentFLO Technologies Pvt. Ltd.</strong> — the Platform ("RentFLO");</li>
        <li><strong className="text-[#8B5CF6]">The Landlord (Owner)</strong> — the registered owner of the property at <em>{property.address}</em>; and</li>
        <li><strong className="text-[#8B5CF6]">The Tenant</strong> — the occupant of the above property.</li>
      </ol>

      <h3 className="text-[#8B5CF6] font-semibold mt-4 uppercase tracking-wider text-xs">1. Purpose</h3>
      <p>
        RentFLO advances the monthly rent of <strong className="text-[#8B5CF6]">₹{property.monthlyRent.toLocaleString("en-IN")}</strong> to
        the Landlord on or before the {property.payoutDay}{ordinal(property.payoutDay)} of each calendar month ("Payout Day"),
        regardless of whether the Tenant has yet remitted payment. The Tenant agrees to repay the same amount
        to RentFLO within the same calendar month, in one or more installments via the RentFLO platform.
      </p>

      <h3 className="text-[#8B5CF6] font-semibold uppercase tracking-wider text-xs">2. Landlord Obligations</h3>
      <p>
        The Landlord agrees to: (a) maintain the property in a habitable condition; (b) not seek rent directly
        from the Tenant for any month in which RentFLO has advanced funds; (c) repay to RentFLO any advanced
        amount in the event the tenancy is terminated before the Tenant repays.
      </p>

      <h3 className="text-[#8B5CF6] font-semibold uppercase tracking-wider text-xs">3. Tenant Obligations</h3>
      <p>
        The Tenant agrees to: (a) repay the advanced rent to RentFLO in full within the calendar month of
        advance; (b) not make any rent payments directly to the Landlord for months covered by this Agreement;
        (c) notify RentFLO immediately of any tenancy changes.
      </p>

      <h3 className="text-[#8B5CF6] font-semibold uppercase tracking-wider text-xs">4. Default</h3>
      <p>
        In the event the Tenant fails to repay within the stipulated period, RentFLO reserves the right to
        report the default to credit bureaus, initiate recovery proceedings, and suspend platform access.
        The Landlord is not liable for the Tenant's default to RentFLO.
      </p>

      <h3 className="text-[#8B5CF6] font-semibold uppercase tracking-wider text-xs">5. Physical Execution</h3>
      <p>
        This Agreement is executed by physical signatures of all parties on a printed copy. The executed copy
        is retained by RentFLO and is available upon request. The agreement status on this platform is updated
        by a RentFLO representative once physical signing is confirmed.
      </p>

      <h3 className="text-[#8B5CF6] font-semibold uppercase tracking-wider text-xs">6. Governing Law</h3>
      <p>
        This Agreement is governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction
        of courts in Mumbai, Maharashtra.
      </p>

      <p className="pt-2 border-t border-[#8B5CF6]/20 text-[#DDD6FE]/70 text-xs">
        By signing below, <strong>{userName}</strong>, you confirm that you have read, understood, and agree
        to be bound by all terms of this Agreement.
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AgreementPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<AgreementData>({
    queryKey: ["/api/agreements/mine"],
  });

  const fullySignedAt = data?.agreement?.tenantSignedAt
    ? new Date(data.agreement.tenantSignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const isSigned = data?.agreement?.status === "FULLY_SIGNED";
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
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#8B5CF6]/35 mb-4">
              <FileText size={13} className="text-[#8B5CF6]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DDD6FE]">{t("agr_badge")}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1 text-[#8B5CF6]"
              style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              {t("agr_title")}
            </h1>
            <p className="text-[#DDD6FE] text-sm sm:text-base">
              Physical signing · Status updated by your RentFLO representative
            </p>
          </div>

          {/* No property */}
          {!data?.property && (
            <div className="border border-[#8B5CF6]/35 p-6 text-[#DDD6FE] text-sm">
              {t("agr_no_property")}
              <Button
                className="mt-4 h-10 bg-[#8B5CF6] text-white hover:bg-[#7C3AED] font-bold rounded-none block"
                onClick={() => setLocation("/setup")}
              >
                {t("agr_go_to_setup")}
              </Button>
            </div>
          )}

          {/* ── Fully signed ── */}
          {isSigned && data?.property && (
            <div className="space-y-5">
              <div className="border-2 border-[#8B5CF6] p-6 sm:p-8 space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-10 h-10 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-xl font-bold text-[#8B5CF6]">{t("agr_signed_title")}</h2>
                    <p className="text-[#DDD6FE] text-sm mt-1">
                      This agreement has been physically signed by all parties and confirmed by RentFLO.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 h-12 bg-[#8B5CF6] text-white hover:bg-[#7C3AED] font-bold rounded-none"
                    onClick={() => setLocation(dashboardPath)}
                    data-testid="button-go-to-dashboard"
                  >
                    {t("agr_go_to_dashboard")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-none bg-transparent font-semibold"
                    onClick={() => {
                      const property = data.property!;
                      const print = openPrintDocument(`RentFLO Agreement — ${property.address}`, agreementPrintCss, 700, 900);
                      if (!print) return;
                      const meta = print.doc.createElement("div");
                      meta.className = "meta";
                      const addMeta = (label: string, value: unknown) => {
                        const item = print.doc.createElement("div");
                        appendTextElement(print.doc, item, "div", label, "label");
                        appendTextElement(print.doc, item, "div", value, "value");
                        meta.append(item);
                      };
                      appendTextElement(print.doc, print.body, "div", "RentFLO", "brand");
                      appendTextElement(print.doc, print.body, "div", "Tripartite Rent Advance Agreement", "badge");
                      appendTextElement(print.doc, print.body, "h1", "Rental Agreement");
                      appendTextElement(print.doc, print.body, "p", "This agreement is entered into between the Owner, RentFLO Technologies Pvt. Ltd. (Platform), and the Tenant.");
                      addMeta("Property", property.address);
                      addMeta("Monthly Rent", `₹${property.monthlyRent.toLocaleString()}`);
                      addMeta("Payout Day", `${property.payoutDay}${ordinal(property.payoutDay)} of Month`);
                      addMeta("Signed On", fullySignedAt);
                      addMeta("Agreement Status", "FULLY SIGNED");
                      addMeta("Tenant", userName);
                      print.body.append(meta);
                      appendDivider(print.doc, print.body);
                      [
                        ["1. Rent Advance", "RentFLO advances the monthly rent to the Owner on the agreed payout day regardless of whether the Tenant has paid. The Tenant is then obligated to reimburse RentFLO by the same date each month."],
                        ["2. Tenant Obligations", "Pay monthly rent on time, maintain the property in good condition, and report maintenance issues promptly via the RentFLO platform."],
                        ["3. Owner Obligations", "Ensure the property is habitable and respond to maintenance requests within a reasonable time."],
                        ["4. Governing Law", "This Agreement is governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra."],
                      ].forEach(([heading, content]) => {
                        appendTextElement(print.doc, print.body, "h2", heading);
                        appendTextElement(print.doc, print.body, "p", content);
                      });
                      const signature = print.doc.createElement("div");
                      signature.className = "sig-box";
                      appendTextElement(print.doc, signature, "div", "Physical Signature — Confirmed by RentFLO", "label");
                      appendTextElement(print.doc, signature, "p", `✓ Physically signed and confirmed on ${fullySignedAt}`);
                      print.body.append(signature);
                      appendTextElement(print.doc, print.body, "div", "rentflo.com · This is a legally binding agreement · Keep for your records", "footer");
                      print.win.focus();
                      setTimeout(() => print.win.print(), 400);
                    }}
                    data-testid="button-download-agreement"
                  >
                    <Download size={15} className="mr-2" />
                    {t("agr_download_pdf")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Pending physical signing ── */}
          {!isSigned && data?.property && (
            <div className="space-y-6">

              {/* Agreement text — for reference */}
              <div className="border border-[#8B5CF6]/28 bg-black">
                <div className="px-5 py-3 border-b border-[#8B5CF6]/20 flex items-center gap-2">
                  <FileText size={14} className="text-[#DDD6FE]" />
                  <span className="text-xs uppercase tracking-wider text-[#DDD6FE] font-semibold">
                    {t("agr_rent_advance")} — {data.property.address}
                  </span>
                </div>
                <div className="p-5 sm:p-6 overflow-y-auto max-h-[340px] sm:max-h-[420px]" data-testid="div-agreement-text">
                  <AgreementBody property={data.property} userName={userName} />
                </div>
              </div>

              {/* Status: awaiting physical signing */}
              <div className="border border-yellow-500/50 bg-yellow-500/5 p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-yellow-500/40 bg-yellow-500/10 shrink-0">
                  <PenLine size={18} className="text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-yellow-400">Awaiting Physical Signing</h2>
                  <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                    Please sign a printed copy of this agreement with your RentFLO representative.
                    Once both parties have signed, the status will be updated here automatically.
                  </p>
                  <p className="text-zinc-600 text-xs mt-3">
                    No action required on the app. Contact support if you need a printed copy.
                  </p>
                </div>
              </div>

              {/* Party status pills */}
              {(() => {
                const status = data?.agreement?.status ?? 'PENDING';
                const ownerSigned = status === 'OWNER_SIGNED' || status === 'FULLY_SIGNED';
                const tenantSigned = status === 'TENANT_SIGNED' || status === 'FULLY_SIGNED';
                const pills = [
                  { label: t("agr_rentflo_party"), signed: true },
                  { label: t("agr_landlord_party"), signed: ownerSigned },
                  { label: t("agr_tenant_party"),   signed: tenantSigned },
                ];
                return (
                  <div className="grid grid-cols-3 gap-3">
                    {pills.map(({ label, signed: s }) => (
                      <div
                        key={label}
                        className={`flex flex-col items-center justify-center p-3 border text-center ${
                          s ? "border-[#8B5CF6] bg-[#8B5CF6]/8" : "border-[#8B5CF6]/25"
                        }`}
                      >
                        <span className={`text-xs font-semibold uppercase tracking-wider ${s ? "text-[#8B5CF6]" : "text-[#DDD6FE]/50"}`}>
                          {label}
                        </span>
                        <span className={`text-[10px] mt-0.5 ${s ? "text-[#8B5CF6]" : "text-[#DDD6FE]/30"}`}>
                          {s ? t("agr_signed_tick") : t("agr_pending")}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
