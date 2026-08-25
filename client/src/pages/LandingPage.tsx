/* Style contract: preserve the user's supplied dark owners-and-tenants artwork as one exact, responsive visual within the landing-page flow. */
import { useState, useEffect } from "react";
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

          <div className="mx-auto w-full max-w-[853px]">
            <img
              src="/rentflo-owners-tenants-upgraded.jpeg"
              alt="RentFLO pays owners their full rent upfront and lets tenants repay on a flexible monthly or weekly schedule"
              className="h-auto w-full rounded-[24px] object-contain"
              loading="lazy"
            />
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

          <div className="mx-auto w-full max-w-[1086px]">
            <img
              src="/rentflo-why-rentflo-upgraded.png"
              alt="Why RentFLO: rent on time, zero risk, easy repairs and maintenance, and no tenant chasing"
              className="h-auto w-full object-contain"
              loading="lazy"
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
            className="audience-panel relative overflow-hidden rounded-[2px]"
            data-audience={audienceTab}
            style={audienceTab === "owners" ? {
              background: "radial-gradient(circle at 76% 14%, rgba(59,130,246,0.16), transparent 30%), linear-gradient(145deg, #101722 0%, #070B11 56%, #05080D 100%)",
              border: "1px solid rgba(68,143,255,0.42)",
              boxShadow: "0 26px 80px rgba(0,0,0,0.46), inset 0 1px 0 rgba(117,172,255,0.18)",
            } : isLight ? {
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
                backgroundImage: audienceTab === "owners"
                  ? "linear-gradient(rgba(67,131,214,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(67,131,214,0.18) 1px, transparent 1px)"
                  : isLight
                  ? "linear-gradient(rgba(15,118,110,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.04) 1px, transparent 1px)"
                  : "linear-gradient(color-mix(in srgb, var(--audience-accent) 10%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--audience-accent) 10%, transparent) 1px, transparent 1px)",
                backgroundSize: audienceTab === "owners" ? "54px 54px" : "48px 48px",
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
                 background: audienceTab === "owners" ? "rgba(50,135,255,0.32)" : isLight ? "color-mix(in srgb, var(--audience-accent) 12%, transparent)" : "var(--audience-accent-glow)",
              }}
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">

              {/* Left: big headline */}
              <div
                className="p-10 md:p-14 flex flex-col justify-between"
                 style={{ borderRight: audienceTab === "owners" ? "1px solid rgba(72,144,244,0.24)" : isLight ? "1px solid var(--border-subtle)" : "1px solid color-mix(in srgb, var(--audience-accent) 16%, transparent)" }}
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
                     style={audienceTab === "owners" ? { background: "linear-gradient(100deg, #57A7FF 0%, #3A8CFF 100%)", color: "#07111F", boxShadow: "0 12px 28px rgba(44,133,255,0.30)" } : { background: "var(--audience-accent)", color: "#07111F", boxShadow: "0 0 24px var(--audience-accent-glow)" }}
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
                      <div className="mt-1 flex-shrink-0 w-6 h-6 flex items-center justify-center" style={audienceTab === "owners" ? { border: "1px solid rgba(84,158,255,0.65)", background: "rgba(53,131,247,0.10)", boxShadow: "0 0 18px rgba(56,145,255,0.22)" } : { border: "1px solid var(--audience-accent-border)", background: "var(--audience-accent-soft)", boxShadow: "0 0 14px var(--audience-accent-glow)" }}>
                        <div className="w-1.5 h-1.5" style={audienceTab === "owners" ? { background: "#57A7FF", boxShadow: "0 0 10px #57A7FF" } : { background: "var(--audience-accent)", boxShadow: "0 0 8px var(--audience-accent)" }} />
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
