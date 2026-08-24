/** Design: KYC keeps its original security flow while using the RentFLO violet accent system. */
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, CheckCircle, Clock, ShieldCheck, FileSignature, Zap, ExternalLink, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { safeHttpsUrl } from "@/lib/safe-url";
import type { User } from "@shared/schema";

type DocType = "PAN" | "AADHAAR";

const SILVER_BTN: React.CSSProperties = {
  background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)',
  color: '#000',
};

export default function Verify() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const [docType, setDocType] = useState<DocType>("PAN");
  const [formData, setFormData] = useState({
    fullLegalName: "",
    panNumber: "",
    aadhaarNumber: "",
    kycDocumentUrl: "",
    bankAccountNumber: "",
    ifscCode: "",
    cancelledChequeUrl: "",
  });

  const { data: currentUser, isLoading } = useQuery<User>({ queryKey: ["/api/auth/user"] });

  // === Didit E-KYC ===
  const [diditLoading, setDiditLoading] = useState(false);
  const [diditPolling, setDiditPolling] = useState(false);

  // Return-trip handler: Didit redirects owners back to /verify?kyc=didit.
  // Poll /api/kyc/didit/status until verified or timeout (~36 s).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDidit = params.get("kyc") === "didit" || sessionStorage.getItem("didit:in_progress") === "1";
    if (!isDidit) return;

    setDiditPolling(true);
    let cancelled = false;
    let attempts = 0;

    const finalize = async () => {
      while (!cancelled && attempts < 12) {
        attempts += 1;
        try {
          const r = await apiRequest("GET", "/api/kyc/didit/status");
          const data = await r.json().catch(() => ({}));
          if (data?.verified) {
            sessionStorage.removeItem("didit:in_progress");
            if (!cancelled) {
              setDiditPolling(false);
              toast({ title: "Identity Verified!", description: "Your KYC is complete." });
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              window.history.replaceState({}, "", "/verify");
            }
            return;
          }
        } catch {
          // transient error — retry
        }
        if (!cancelled) await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      if (!cancelled) {
        sessionStorage.removeItem("didit:in_progress");
        setDiditPolling(false);
        toast({
          title: "Verification not completed",
          description: "Please try again or finish the flow on Didit.",
          variant: "destructive",
        });
        window.history.replaceState({}, "", "/verify");
      }
    };

    void finalize();
    return () => { cancelled = true; };
  }, [toast]);

  const handleDiditStart = async () => {
    setDiditLoading(true);
    try {
      const r = await apiRequest("POST", "/api/kyc/didit/start");
      const data = await r.json();
      const diditUrl = safeHttpsUrl(data?.url, "didit.me");
      if (!r.ok || !diditUrl) {
        throw new Error(data?.message || "Could not start Didit verification.");
      }
      sessionStorage.setItem("didit:in_progress", "1");
      window.location.assign(diditUrl);
    } catch (err: any) {
      toast({ title: "Could not start Didit", description: err?.message ?? "Please try again.", variant: "destructive" });
      setDiditLoading(false);
    }
  };

  const submitKycMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/kyc/submit", data);
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Submission failed"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "KYC Submitted", description: "We'll review your documents within 1–2 business days." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "kycDocumentUrl" | "cancelledChequeUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, [field]: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullLegalName.trim()) { toast({ title: "Full legal name is required", variant: "destructive" }); return; }
    if (docType === "PAN" && !formData.panNumber.trim()) { toast({ title: "PAN number is required", variant: "destructive" }); return; }
    if (docType === "AADHAAR" && !formData.aadhaarNumber.trim()) { toast({ title: "Aadhaar number is required", variant: "destructive" }); return; }
    submitKycMutation.mutate({
      ...formData,
      panNumber: docType === "PAN" ? formData.panNumber : "",
      aadhaarNumber: docType === "AADHAAR" ? formData.aadhaarNumber : "",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 animate-spin" />
      </div>
    );
  }

  // Shown while polling Didit status after returning from their hosted flow
  if (diditPolling) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5 px-6">
        <Loader2 className="w-12 h-12 text-[#8B5CF6] animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-base font-semibold text-zinc-200">Checking verification status…</p>
          <p className="text-sm text-zinc-500">This takes a few seconds. Please don't close the page.</p>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.role === "OWNER";
  const isVerified = currentUser?.isVerified;
  const hasPendingKyc = (currentUser?.panNumber || currentUser?.aadhaarNumber) && !isVerified;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
      <main className="min-h-screen flex flex-col">
        <div className="flex-1 p-5 sm:p-8 md:p-10 pb-24 max-w-2xl w-full mx-0">

          <div className="mb-8 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#8B5CF6]/30 mb-4">
              <ShieldCheck size={13} className="text-[#8B5CF6]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DDD6FE]">{t('kyc_identity_badge')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-1 silver-text">
              {t('kyc_page_title')}
            </h1>
            <p className="text-zinc-500 text-sm sm:text-base">{t('kyc_page_subtitle')}</p>
          </div>

          {/* VERIFIED */}
          {isVerified ? (
            <div className="border border-[#8B5CF6]/45 bg-[#8B5CF6]/[0.06] p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-10 h-10 text-[#8B5CF6] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-bold silver-text">{t('kyc_verified_title')}</h2>
                  <p className="text-zinc-500 text-sm mt-1">{t('kyc_verified_desc')}</p>
                </div>
              </div>
              <Button className="w-full h-12 rounded-none border-0 flex items-center justify-center gap-2"
                style={SILVER_BTN} onClick={() => setLocation("/agreement")} data-testid="button-go-to-agreement">
                <FileSignature size={16} />
                {t('kyc_sign_agreement')}
              </Button>
            </div>

          /* PENDING */
          ) : hasPendingKyc ? (
            <div className="border-2 border-yellow-500/60 bg-yellow-500/5 p-6 sm:p-8 flex items-start gap-4">
              <Clock className="w-10 h-10 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-yellow-400">{t('kyc_under_review_title')}</h2>
                <p className="text-zinc-500 text-sm mt-1">{t('kyc_under_review_desc')}</p>
              </div>
            </div>

          /* FORM */
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Didit — instant E-KYC (primary) */}
              <div className="border border-[#8B5CF6]/45 bg-[#8B5CF6]/[0.06] p-5 sm:p-6 space-y-4" data-testid="card-didit">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 shrink-0">
                    <Zap size={18} className="text-[#8B5CF6]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold uppercase tracking-wider text-[#DDD6FE]">
                      {t('didit_title')}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      {t('didit_subtitle')}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleDiditStart}
                  disabled={diditLoading}
                  className="w-full h-12 rounded-none border-0 text-sm font-bold uppercase tracking-widest bg-[#8B5CF6] hover:bg-[#7C3AED] text-white flex items-center justify-center gap-2"
                  data-testid="button-didit-start"
                >
                  {diditLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t('didit_opening')}
                    </>
                  ) : (
                    <>
                      <ExternalLink size={16} />
                      {t('didit_button')}
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-zinc-500 text-center">
                  {t('didit_redirect_note')}
                </p>

                {/* Didit branding */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.07] bg-white/[0.03]">
                    {/* Didit logo mark — partial-ring circle */}
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="13" stroke="#4F8EF7" strokeWidth="4" strokeLinecap="round"
                        strokeDasharray="62 20" strokeDashoffset="-5" />
                    </svg>
                    <span className="text-[11px] font-semibold tracking-wide text-zinc-300" style={{ fontFamily: "Inter, sans-serif" }}>
                      Didit
                    </span>
                    <span className="text-[10px] text-zinc-600 ml-0.5">· Identity Verification</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">{t("verify_or_manual")}</span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>


              <div className="border border-[#8B5CF6]/18 bg-black p-5 sm:p-6 space-y-5">
                <h2 className="text-base font-semibold uppercase tracking-wider text-[#DDD6FE]/80">
                  {t('kyc_identity_info')}
                </h2>

                <div className="space-y-1.5">
                  <Label htmlFor="fullLegalName" className="text-xs uppercase tracking-wider text-zinc-500">
                    {t('kyc_full_legal_name')}
                  </Label>
                  <Input id="fullLegalName" value={formData.fullLegalName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullLegalName: e.target.value }))}
                    className="bg-black border-[#8B5CF6]/25 text-zinc-200 placeholder:text-zinc-600 h-11 rounded-none focus:border-[#8B5CF6]/60"
                    placeholder={t('kyc_name_placeholder')} required data-testid="input-full-legal-name" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">
                    {t('kyc_id_type')} <span className="text-zinc-600 normal-case font-normal">{t('kyc_choose_one')}</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setDocType("PAN")}
                      className={`h-11 text-sm font-semibold uppercase tracking-wide transition-all border ${
                        docType === "PAN"
                          ? "border-0 text-black"
                          : "bg-black text-[#DDD6FE]/70 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/45 hover:text-[#8B5CF6]"
                      }`}
                      style={docType === "PAN" ? SILVER_BTN : undefined}
                      data-testid="toggle-pan">
                      {t('kyc_pan_card')}
                    </button>
                    <button type="button" onClick={() => setDocType("AADHAAR")}
                      className={`h-11 text-sm font-semibold uppercase tracking-wide transition-all border ${
                        docType === "AADHAAR"
                          ? "border-0 text-black"
                          : "bg-black text-[#DDD6FE]/70 border-[#8B5CF6]/20 hover:border-[#8B5CF6]/45 hover:text-[#8B5CF6]"
                      }`}
                      style={docType === "AADHAAR" ? SILVER_BTN : undefined}
                      data-testid="toggle-aadhaar">
                      {t('kyc_aadhaar')}
                    </button>
                  </div>
                </div>

                {docType === "PAN" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="panNumber" className="text-xs uppercase tracking-wider text-zinc-500">
                      {t('kyc_pan_number')}
                    </Label>
                    <Input id="panNumber" value={formData.panNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                      className="bg-black border-[#8B5CF6]/25 text-zinc-200 placeholder:text-zinc-600 h-11 rounded-none font-mono focus:border-[#8B5CF6]/60"
                      placeholder="ABCDE1234F" pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" maxLength={10}
                      required={docType === "PAN"} data-testid="input-pan-number" />
                    <p className="text-xs text-zinc-600">{t('kyc_pan_hint')}</p>
                  </div>
                )}

                {docType === "AADHAAR" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="aadhaarNumber" className="text-xs uppercase tracking-wider text-zinc-500">
                      {t('kyc_aadhaar_number')}
                    </Label>
                    <Input id="aadhaarNumber" value={formData.aadhaarNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                      className="bg-black border-[#8B5CF6]/25 text-zinc-200 placeholder:text-zinc-600 h-11 rounded-none font-mono focus:border-[#8B5CF6]/60"
                      placeholder="1234 5678 9012" maxLength={12}
                      required={docType === "AADHAAR"} data-testid="input-aadhaar-number" />
                    <p className="text-xs text-zinc-600">{t('kyc_aadhaar_hint')}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-zinc-500">
                    {docType === "PAN" ? t('kyc_upload_pan') : t('kyc_upload_aadhaar')}
                  </Label>
                  <label className="flex items-center gap-3 h-11 px-4 border border-[#8B5CF6]/25 cursor-pointer hover:border-[#8B5CF6]/55 hover:bg-[#8B5CF6]/[0.06] transition-colors" data-testid="label-kyc-upload">
                    <Upload size={15} className="text-[#DDD6FE]/70" />
                    <span className="text-sm text-zinc-400">
                      {formData.kycDocumentUrl ? t('kyc_doc_uploaded') : t('kyc_choose_file')}
                    </span>
                    <input type="file" accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, "kycDocumentUrl")}
                      className="hidden" data-testid="input-kyc-document" />
                  </label>
                  {formData.kycDocumentUrl && (
                    <p className="text-xs text-[#8B5CF6]">{t('kyc_doc_ready')}</p>
                  )}
                </div>
              </div>

              {/* Bank details — owner only */}
              {isOwner && (
                <div className="border border-[#8B5CF6]/18 bg-black p-5 sm:p-6 space-y-5">
                  <h2 className="text-base font-semibold uppercase tracking-wider text-[#DDD6FE]/80">
                    {t('kyc_bank_details')}
                    <span className="ml-2 text-zinc-600 normal-case font-normal text-xs">{t('kyc_landlords_only')}</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="bankAccountNumber" className="text-xs uppercase tracking-wider text-zinc-500">
                        {t('kyc_account_number')}
                      </Label>
                      <Input id="bankAccountNumber" value={formData.bankAccountNumber}
                        onChange={(e) => setFormData((p) => ({ ...p, bankAccountNumber: e.target.value.replace(/\D/g, "") }))}
                        className="bg-black border-[#8B5CF6]/25 text-zinc-200 placeholder:text-zinc-600 h-11 rounded-none font-mono focus:border-[#8B5CF6]/60"
                        placeholder={t('kyc_account_placeholder')} required data-testid="input-bank-account" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ifscCode" className="text-xs uppercase tracking-wider text-zinc-500">
                        {t('kyc_ifsc_code')}
                      </Label>
                      <Input id="ifscCode" value={formData.ifscCode}
                        onChange={(e) => setFormData((p) => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                        className="bg-black border-[#8B5CF6]/25 text-zinc-200 placeholder:text-zinc-600 h-11 rounded-none font-mono focus:border-[#8B5CF6]/60"
                        placeholder="HDFC0001234" pattern="[A-Z]{4}0[A-Z0-9]{6}" maxLength={11}
                        required data-testid="input-ifsc-code" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-zinc-500">
                        {t('kyc_cancelled_cheque')}
                      </Label>
                      <label className="flex items-center gap-3 h-11 px-4 border border-[#8B5CF6]/25 cursor-pointer hover:border-[#8B5CF6]/55 hover:bg-[#8B5CF6]/[0.06] transition-colors" data-testid="label-cheque-upload">
                        <Upload size={15} className="text-[#DDD6FE]/70" />
                        <span className="text-sm text-zinc-400">
                          {formData.cancelledChequeUrl ? t('kyc_uploaded_tick') : t('kyc_upload_cheque')}
                        </span>
                        <input type="file" accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, "cancelledChequeUrl")}
                          className="hidden" data-testid="input-cancelled-cheque" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-13 rounded-none border-0 text-base font-bold"
                style={SILVER_BTN} disabled={submitKycMutation.isPending} data-testid="button-submit-kyc">
                {submitKycMutation.isPending ? t('kyc_submitting') : t('kyc_submit')}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
