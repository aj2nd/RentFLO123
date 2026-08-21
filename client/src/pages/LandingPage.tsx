import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ShieldCheck, Zap, Building2, Clock, Plus, Minus, Home, Users, UserPlus, FileCheck, Wallet } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";

export default function LandingPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [audienceTab, setAudienceTab] = useState<"owners" | "tenants">("owners");
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      if (!user?.role) {
        navigate("/onboarding");
      } else {
        const dest: Record<string, string> = { TENANT: "/tenant", OWNER: "/owner", ADMIN: "/admin" };
        navigate(dest[user.role] ?? "/onboarding");
      }
    }
  }, [isAuthenticated, isLoading, user?.role]);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── New cinematic hero ───────────────────────────────────────────── */}
      <main className="rentflo-hero">
        <img
          src="/rentflo-home-hero.png"
          alt="RentFLO flexible rent payments for tenants and upfront rent collection for owners"
          className="rentflo-hero-image"
        />
        <div className="rentflo-hero-scrim" />
        <div className="rentflo-hero-hotspots" aria-label="RentFLO navigation">
          <a href="/about" className="rentflo-hero-hotspot rentflo-hero-hotspot-about" aria-label="About RentFLO" />
          <a href="#how-it-works" className="rentflo-hero-hotspot rentflo-hero-hotspot-how" aria-label="How RentFLO works" />
          <a href="/support" className="rentflo-hero-hotspot rentflo-hero-hotspot-contact" aria-label="Contact RentFLO" />
          <a href="/api/login" className="rentflo-hero-hotspot rentflo-hero-hotspot-login" aria-label="Log in to RentFLO" data-testid="button-hero-login" />
          <a href="/onboarding?role=TENANT" className="rentflo-hero-hotspot rentflo-hero-hotspot-tenant" aria-label="Continue as a tenant" data-testid="button-hero-tenant" />
          <a href="/onboarding?role=OWNER" className="rentflo-hero-hotspot rentflo-hero-hotspot-owner" aria-label="Continue as an owner" data-testid="button-hero-owner" />
        </div>
      </main>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-8 md:px-16" style={isLight ? { background: "var(--section-sage)" } : {}}>
        <div className="max-w-screen-xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.04] mb-10">
            <ArrowRight size={11} style={{ color: "var(--tiffany)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-[2px]" style={{ color: "var(--tiffany)", opacity: 0.7 }}>{t("landing_how_it_works")}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text mb-20 leading-tight">
            {t("landing_rent_now")}<br />{t("landing_pay_later")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* Step 1 */}
            <div
              className="rounded-2xl p-8 md:p-10 flex flex-col"
              style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
            >
              {/* Badge */}
              <div className="mb-5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]"
                  style={isLight ? {
                    background: "var(--color-violet-bg)",
                    border: "1px solid var(--color-violet-border)",
                    color: "var(--color-violet)",
                  } : {
                    background: "var(--owner-accent-soft)",
                    border: "1px solid var(--owner-accent-border)",
                    color: "var(--owner-accent)",
                  }}
                >
                  <Home size={10} />
                  {t("landing_for_owners")}
                </span>
              </div>
              {/* Number + illustration row */}
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="text-[80px] font-black leading-none select-none flex-shrink-0 w-20 text-center"
                  style={isLight ? {
                    background: 'linear-gradient(160deg, rgba(124,58,237,0.30) 0%, rgba(124,58,237,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } : {
                    background: 'linear-gradient(160deg, color-mix(in srgb, var(--owner-accent) 28%, transparent) 0%, var(--owner-accent) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  1
                </span>
                {/* Building + calendar illustration */}
                <div className="flex-1 flex items-center justify-center gap-4">
                  {/* Property building */}
                  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="28" width="54" height="54" rx="4" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1.5"/>
                    {/* Awning stripes */}
                    <rect x="8" y="28" width="54" height="14" rx="4" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1.5"/>
                    <line x1="18" y1="28" x2="18" y2="42" stroke="var(--owner-accent-border)" strokeWidth="4"/>
                    <line x1="30" y1="28" x2="30" y2="42" stroke="var(--owner-accent-border)" strokeWidth="4"/>
                    <line x1="42" y1="28" x2="42" y2="42" stroke="var(--owner-accent-border)" strokeWidth="4"/>
                    {/* Windows */}
                    <rect x="16" y="50" width="12" height="10" rx="1.5" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1"/>
                    <rect x="36" y="50" width="12" height="10" rx="1.5" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1"/>
                    {/* Door */}
                    <rect x="23" y="65" width="14" height="17" rx="2" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1.2"/>
                    {/* Sign */}
                    <rect x="14" y="20" width="42" height="10" rx="2" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1"/>
                    <text x="35" y="28" textAnchor="middle" fontSize="6" fontWeight="700" fill="var(--owner-accent)" fontFamily="Inter, sans-serif">STORE</text>
                  </svg>
                  {/* Calendar */}
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="12" width="60" height="54" rx="6" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1.5"/>
                    {/* Header bar */}
                    <rect x="6" y="12" width="60" height="18" rx="6" fill="var(--owner-accent-soft)" stroke="var(--owner-accent-border)" strokeWidth="1.5"/>
                    {/* Calendar rings */}
                    <rect x="20" y="6" width="5" height="14" rx="2.5" fill="var(--owner-accent)"/>
                    <rect x="47" y="6" width="5" height="14" rx="2.5" fill="var(--owner-accent)"/>
                    {/* Big "1" date */}
                    <text x="36" y="56" textAnchor="middle" fontSize="28" fontWeight="900" fill="var(--owner-accent)" fontFamily="Inter, sans-serif">1</text>
                    <text x="36" y="24" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--owner-accent)" fontFamily="Inter, sans-serif" letterSpacing="1">1ST</text>
                  </svg>
                </div>
              </div>
              <p className="text-base md:text-lg font-light leading-relaxed text-muted-foreground">
                {t("landing_owner_pay_full")}
              </p>
            </div>

            {/* Step 2 */}
            <div
              className="rounded-2xl p-8 md:p-10 flex flex-col"
              style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
            >
              {/* Badge */}
              <div className="mb-5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]"
                  style={isLight ? {
                    background: "var(--color-gold-bg)",
                    border: "1px solid var(--color-gold-border)",
                    color: "var(--color-gold)",
                  } : {
                    background: "var(--tenant-accent-soft)",
                    border: "1px solid var(--tenant-accent-border)",
                    color: "var(--tenant-accent)",
                  }}
                >
                  <Users size={10} />
                  {t("landing_for_tenants")}
                </span>
              </div>
              {/* Number + illustration row */}
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="text-[80px] font-black leading-none select-none flex-shrink-0 w-20 text-center"
                  style={isLight ? {
                    background: 'linear-gradient(160deg, rgba(217,119,6,0.30) 0%, rgba(217,119,6,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } : {
                    background: 'linear-gradient(160deg, color-mix(in srgb, var(--tenant-accent) 28%, transparent) 0%, var(--tenant-accent) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  2
                </span>
                {/* Receipt → split payments illustration */}
                <div className="flex-1 flex items-center justify-center gap-3">
                  {/* Long receipt */}
                  <svg width="72" height="90" viewBox="0 0 72 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="4" width="56" height="78" rx="4" fill="var(--tenant-accent-soft)" stroke="var(--tenant-accent-border)" strokeWidth="1.5"/>
                    {/* Receipt lines */}
                    {[18, 30, 42, 54, 66].map((y, i) => (
                      <rect key={i} x="16" y={y} width={i % 2 === 0 ? 40 : 28} height="5" rx="2" fill="var(--tenant-accent-border)"/>
                    ))}
                    {/* Zigzag bottom */}
                    <path d="M8 82 L14 86 L20 82 L26 86 L32 82 L38 86 L44 82 L50 86 L56 82 L62 86 L64 82" stroke="var(--tenant-accent-border)" strokeWidth="1.5" fill="none"/>
                  </svg>

                  {/* Arrow */}
                  <ArrowRight size={20} style={{ color: "var(--tenant-accent)", opacity: 0.75, flexShrink: 0 }} />

                  {/* 3 smaller receipts */}
                  <div className="flex flex-col gap-2">
                    {[62, 48, 36].map((w, i) => (
                      <svg key={i} width={w} height="26" viewBox={`0 0 ${w} 26`} fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width={w - 2} height="20" rx="3" fill="var(--tenant-accent-soft)" stroke="var(--tenant-accent-border)" strokeWidth="1.2"/>
                        <rect x="6" y="7" width={w - 22} height="4" rx="1.5" fill="var(--tenant-accent-border)"/>
                        <rect x="6" y="14" width={w - 30} height="3" rx="1.5" fill="var(--tenant-accent-soft)"/>
                        <path d={`M1 21 L4 25 L8 21 L12 25 L16 21 L20 25 L24 21 L${w - 1} 21`} stroke="var(--tenant-accent-border)" strokeWidth="1" fill="none"/>
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-base md:text-lg font-light leading-relaxed text-muted-foreground">
                {t("landing_tenant_pay_back")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features-section" className="py-28 px-8 md:px-16" style={isLight ? { background: "var(--section-violet)" } : {}}>
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-16">
            <p className="text-[10px] font-semibold uppercase tracking-[2.5px] mb-4" style={{ color: "var(--tiffany)", opacity: 0.55 }}>{t("landing_why_rentflo")}</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text max-w-lg leading-tight">
              {t("landing_built_for_landlords")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            <FeatureCard
              icon={<Zap size={18} style={{ color: isLight ? "var(--color-gold-mid,#D97706)" : "var(--tiffany)" }} />}
              iconBg={isLight ? "var(--color-gold-bg,#FEF3C7)" : undefined}
              iconBorder={isLight ? "var(--color-gold-border,rgba(217,119,6,0.30))" : undefined}
              title={t("usp_1_title")}
              desc={t("usp_1_desc")}
              titleKey="usp_1_title"
              descKey="usp_1_desc"
            />
            <FeatureCard
              icon={<ShieldCheck size={18} style={{ color: isLight ? "var(--color-sage-mid,#059669)" : "var(--tiffany)" }} />}
              iconBg={isLight ? "var(--color-sage-bg,#D1FAE5)" : undefined}
              iconBorder={isLight ? "var(--color-sage-border,rgba(5,150,105,0.28))" : undefined}
              title={t("usp_2_title")}
              desc={t("usp_2_desc")}
              titleKey="usp_2_title"
              descKey="usp_2_desc"
            />
            <FeatureCard
              icon={<Building2 size={18} style={{ color: isLight ? "var(--color-violet-mid,#7C3AED)" : "var(--tiffany)" }} />}
              iconBg={isLight ? "var(--color-violet-bg,#EDE9FE)" : undefined}
              iconBorder={isLight ? "var(--color-violet-border,rgba(124,58,237,0.28))" : undefined}
              title={t("usp_3_title")}
              desc={t("usp_3_desc")}
              titleKey="usp_3_title"
              descKey="usp_3_desc"
            />
            <FeatureCard
              icon={<Clock size={18} style={{ color: isLight ? "var(--color-rose-mid,#E11D48)" : "var(--tiffany)" }} />}
              iconBg={isLight ? "var(--color-rose-bg,#FFE4E6)" : undefined}
              iconBorder={isLight ? "var(--color-rose-border,rgba(225,29,72,0.28))" : undefined}
              title={t("usp_4_title")}
              desc={t("usp_4_desc")}
              titleKey="usp_4_title"
              descKey="usp_4_desc"
            />
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── For Owners / For Tenants toggle ───────────────────────────────── */}
      <section className="py-28 px-8 md:px-16" style={isLight ? { background: "var(--section-cream)" } : {}}>
        <div className="max-w-screen-xl mx-auto">

          {/* Eyebrow + toggle pill */}
          <div className="flex flex-col items-center gap-8 mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-[2.5px]" style={{ color: "var(--tiffany)", opacity: 0.55 }}>{t("landing_who_its_for")}</p>
            <div
              className="inline-flex p-1 gap-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
            >
              {(["owners", "tenants"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAudienceTab(tab)}
                  className="px-7 py-2.5 text-sm font-semibold uppercase tracking-[1.5px] transition-all duration-200"
                  style={audienceTab === tab ? {
                    background: tab === "owners" ? "var(--owner-accent)" : "var(--tenant-accent)",
                    color: "#07111F",
                    boxShadow: `0 0 22px ${tab === "owners" ? "var(--owner-accent-glow)" : "var(--tenant-accent-glow)"}`,
                  } : {
                    background: "transparent",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {tab === "owners" ? t("landing_for_owners") : t("landing_for_tenants")}
                </button>
              ))}
            </div>
          </div>

          {/* Card */}
          <div
            className="audience-panel relative overflow-hidden"
            data-audience={audienceTab}
            style={isLight ? {
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-card)",
            } : {
              background: "var(--surface-card)",
              border: "1px solid color-mix(in srgb, var(--audience-accent) 24%, transparent)",
            }}
          >
            {/* Grid bg */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: isLight
                  ? "linear-gradient(rgba(15,118,110,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.04) 1px, transparent 1px)"
                  : "linear-gradient(color-mix(in srgb, var(--audience-accent) 10%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--audience-accent) 10%, transparent) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            {/* Glow */}
            <div
              className="absolute pointer-events-none transition-all duration-500"
              style={{
                top: audienceTab === "owners" ? "-40px" : "auto",
                bottom: audienceTab === "tenants" ? "-40px" : "auto",
                right: "-40px",
                width: "320px",
                height: "320px",
                borderRadius: "50%",
                filter: "blur(80px)",
                 background: isLight ? "color-mix(in srgb, var(--audience-accent) 12%, transparent)" : "var(--audience-accent-glow)",
              }}
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">

              {/* Left: big headline */}
              <div
                className="p-10 md:p-14 flex flex-col justify-between"
                 style={{ borderRight: isLight ? "1px solid var(--border-subtle)" : "1px solid color-mix(in srgb, var(--audience-accent) 16%, transparent)" }}
              >
                <div>
                  <div className="mb-6">
                    {audienceTab === "owners"
                       ? <Home size={40} strokeWidth={1.2} style={{ color: "var(--audience-accent)", opacity: isLight ? 0.95 : 0.9, filter: "drop-shadow(0 0 10px var(--audience-accent-glow))" }} />
                       : <Users size={40} strokeWidth={1.2} style={{ color: "var(--audience-accent)", opacity: isLight ? 0.95 : 0.9, filter: "drop-shadow(0 0 10px var(--audience-accent-glow))" }} />
                    }
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-[-2px] silver-text leading-tight mb-6">
                    {audienceTab === "owners"
                      ? <>{t("landing_owner_tagline")}</>
                      : <>{t("landing_tenant_tagline")}</>
                    }
                  </h3>
                  <p className="text-base font-light leading-relaxed text-muted-foreground max-w-sm">
                    {audienceTab === "owners"
                      ? "We pay you the full month's rent as a lump sum on the 1st — regardless of what your tenants do. Never follow up again."
                      : "RentFLO covers your rent upfront so your landlord gets paid on time. You settle with us in smaller weekly or monthly chunks that work for you."
                    }
                  </p>

                  {/* Process checklist: Sign Up → KYC → Collect/Pay Rent */}
                  <div className="mt-10">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[2px] mb-4"
                       style={{ color: "var(--audience-accent)", opacity: isLight ? 0.9 : 0.75 }}
                    >
                      How it works
                    </p>
                    <ol className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {[
                        { n: 1, label: "Sign Up", Icon: UserPlus },
                        { n: 2, label: "KYC", Icon: FileCheck },
                        { n: 3, label: audienceTab === "owners" ? "Collect Rent" : "Pay Rent", Icon: Wallet },
                      ].map(({ n, label, Icon }, idx, arr) => (
                        <li key={n} className="flex items-center gap-2 sm:gap-3">
                          <div
                            className="flex items-center gap-2 px-3 py-2"
                            style={{
                               background: "var(--audience-accent-soft)",
                               border: "1px solid var(--audience-accent-border)",
                            }}
                          >
                            <span
                              className="flex items-center justify-center text-[10px] font-bold w-4 h-4"
                              style={{
                                 background: "var(--audience-accent)",
                                color: isLight ? "#FFFFFF" : "#000000",
                              }}
                            >
                              {n}
                            </span>
                             <Icon size={14} style={{ color: "var(--audience-accent)" }} />
                            <span
                              className="text-xs font-semibold uppercase tracking-[1px]"
                              style={{ color: "var(--foreground)" }}
                            >
                              {label}
                            </span>
                          </div>
                          {idx < arr.length - 1 && (
                             <ArrowRight size={14} style={{ color: "var(--audience-accent)", opacity: 0.8, flexShrink: 0 }} />
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <div className="mt-10">
                  <a
                    href="/api/login"
                    className="inline-flex items-center gap-2 px-7 py-3 font-bold text-sm uppercase tracking-[1.5px] transition-all duration-200"
                     style={{ background: "var(--audience-accent)", color: "#07111F", boxShadow: "0 0 24px var(--audience-accent-glow)" }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85" }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1" }}
                  >
                    Get Started <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Right: benefit bullets */}
              <div className="p-10 md:p-14">
                 <p className="text-[10px] font-semibold uppercase tracking-[2px] mb-8" style={{ color: "var(--audience-accent)", opacity: 0.8 }}>
                  {audienceTab === "owners" ? t("landing_what_you_get") : t("landing_how_helps")}
                </p>
                <ul className="space-y-6">
                  {(audienceTab === "owners" ? [
                    { title: t("landing_owner_b1_title"), desc: t("landing_owner_b1_desc") },
                    { title: t("landing_owner_b2_title"), desc: t("landing_owner_b2_desc") },
                    { title: t("landing_owner_b3_title"), desc: t("landing_owner_b3_desc") },
                    { title: t("landing_owner_b4_title"), desc: t("landing_owner_b4_desc") },
                  ] : [
                    { title: t("landing_tenant_b1_title"), desc: t("landing_tenant_b1_desc") },
                    { title: t("landing_tenant_b2_title"), desc: t("landing_tenant_b2_desc") },
                    { title: t("landing_tenant_b3_title"), desc: t("landing_tenant_b3_desc") },
                    { title: t("landing_tenant_b4_title"), desc: t("landing_tenant_b4_desc") },
                  ]).map((item: { title: string; desc: string }, i) => (
                    <li key={i} className="flex gap-4">
                      <div
                        className="mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                         style={{ border: "1px solid var(--audience-accent-border)", background: "var(--audience-accent-soft)", boxShadow: "0 0 14px var(--audience-accent-glow)" }}
                      >
                         <div className="w-1.5 h-1.5" style={{ background: "var(--audience-accent)", boxShadow: "0 0 8px var(--audience-accent)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                        <p className="text-sm font-light text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16" style={isLight ? { background: "var(--section-amber)" } : {}}>
        <div className="max-w-screen-xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.04] mb-10">
            <ArrowRight size={11} style={{ color: "var(--tiffany)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-[2px]" style={{ color: "var(--tiffany)", opacity: 0.7 }}>{t("landing_faq_eyebrow")}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text mb-16 leading-tight max-w-lg">
            {t("landing_faq_title")}
          </h2>

          <div className="max-w-3xl space-y-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {[
              { q: t("landing_faq_q1"), a: t("landing_faq_a1") },
              { q: t("landing_faq_q2"), a: t("landing_faq_a2") },
              { q: t("landing_faq_q3"), a: t("landing_faq_a3") },
              { q: t("landing_faq_q4"), a: t("landing_faq_a4") },
              { q: t("landing_faq_q5"), a: t("landing_faq_a5") },
            ].map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16 pb-24">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent mb-12" />
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
            © {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.
          </p>
          <div className="flex items-center gap-6 text-[10px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors">{t("nav_terms_short")}</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">{t("nav_privacy_short")}</a>
            <a href="/refund" className="hover:text-foreground transition-colors">{t("nav_refund_short")}</a>
            <a href="/support" className="hover:text-foreground transition-colors">{t("nav_support_short")}</a>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            <ShieldCheck size={11} />
            <span>{t("landing_bank_grade")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ Data is now loaded inside the component via useI18n ──────────────────

// ── FAQ Item ───────────────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-6 text-left transition-colors duration-150 group"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-base md:text-lg font-medium leading-snug transition-colors duration-150"
          style={{ color: open ? "var(--tiffany)" : "var(--nav-text)" }}
        >
          {question}
        </span>
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: open ? "rgba(111,255,233,0.10)" : "rgba(128,128,128,0.06)",
            border: open ? "1px solid rgba(111,255,233,0.22)" : "1px solid rgba(128,128,128,0.12)",
            color: open ? "var(--tiffany,#6FFFE9)" : "var(--nav-text-dim)",
          }}
        >
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>
      {open && (
        <div className="pb-6 pr-12">
          <p className="text-sm md:text-base leading-relaxed font-light text-muted-foreground">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, titleKey, descKey, iconBg, iconBorder }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  titleKey: string;
  descKey: string;
  iconBg?: string;
  iconBorder?: string;
}) {
  return (
    <div className="bg-background p-8 md:p-10 group hover:bg-card transition-colors duration-300">
      <div
        className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300"
        style={{
          border: `1px solid ${iconBorder ?? "var(--border-accent-dim)"}`,
          background: iconBg ?? "rgba(111,255,233,0.04)",
        }}
      >
        {icon}
      </div>
      <h3
        className="text-lg md:text-xl font-bold tracking-tight silver-text mb-3 leading-snug"
        data-i18n={titleKey}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground font-light" data-i18n={descKey}>
        {desc}
      </p>
    </div>
  );
}
