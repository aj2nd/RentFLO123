import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, ShieldCheck, Zap, Building2, Clock, Plus, Minus, Home, Users } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

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

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main className="px-8 md:px-16 max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_0.85fr] gap-14 items-center min-h-[82vh] pt-16 pb-24">

        <div className="space-y-10">
          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6FFFE9] animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[2px]" style={{ color: "var(--tiffany)", opacity: 0.7 }}>
              Rent Payment Platform
            </span>
          </div>

          {/* Hero headline */}
          <div className="space-y-1">
            <h1 className="text-[40px] sm:text-[60px] md:text-[72px] lg:text-[96px] font-bold tracking-[-2px] sm:tracking-[-3px] md:tracking-[-4px] leading-[0.88] silver-text glow-text select-none">
              NEVER
            </h1>
            <h1 className="text-[40px] sm:text-[60px] md:text-[72px] lg:text-[96px] font-bold tracking-[-2px] sm:tracking-[-3px] md:tracking-[-4px] leading-[0.88] silver-text glow-text select-none">
              CHASE
            </h1>
            <h1 className="text-[40px] sm:text-[60px] md:text-[72px] lg:text-[96px] font-bold tracking-[-2px] sm:tracking-[-3px] md:tracking-[-4px] leading-[0.88] silver-text glow-text select-none">
              RENT.
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-lg md:text-xl font-light leading-relaxed max-w-sm pl-5 tiffany-accent" style={{ color: "var(--nav-text)", borderLeftWidth: '2px' }}>
            <span data-i18n="we_pay_your_rent">{t("we_pay_your_rent")}</span><br />
            <span data-i18n="your_tenant_pays_later">{t("your_tenant_pays_later")}</span><br />
            <span style={{ color: "var(--tiffany)", opacity: 0.7 }} data-i18n="zero_friction">{t("zero_friction")}</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center px-8 rounded-xl font-bold text-sm tracking-[0.06em] uppercase transition-all duration-200 group"
              style={{
                background: 'linear-gradient(135deg, #8A8A8A 0%, #D4D4D4 28%, #F2F2F2 48%, #E0E0E0 58%, #C0C0C0 72%, #8A8A8A 100%)',
                color: '#000',
                height: '52px',
                boxShadow: '0 2px 16px rgba(192,192,192,0.15), inset 0 1px 0 rgba(255,255,255,0.4)'
              }}
              data-testid="button-get-started"
            >
              <span data-i18n="get_started">{t("get_started")}</span>
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
            <a
              href="/api/login"
              className="inline-flex items-center justify-center px-8 rounded-xl transition-all duration-200 font-medium text-sm tracking-[0.04em] uppercase"
              style={{
                height: '52px',
                border: "1px solid var(--nav-border)",
                color: "var(--nav-text)",
                background: "transparent",
              }}
              data-testid="button-login"
            >
              Log In <ArrowRight size={14} className="ml-2" />
            </a>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2" style={{ color: "var(--nav-text-dim)" }}>
              <ShieldCheck size={13} />
              <span className="text-[11px] font-medium tracking-wide uppercase">Bank-Grade Security</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2" style={{ color: "var(--nav-text-dim)" }}>
              <Zap size={13} />
              <span className="text-[11px] font-medium tracking-wide uppercase">Instant Payout</span>
            </div>
          </div>
        </div>

        {/* ── Dashboard preview card ─────────────────────── */}
        <div
          className="relative hidden lg:flex flex-col gap-4 p-8 rounded-2xl overflow-hidden"
          style={{
            minHeight: '540px',
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#6FFFE9]/[0.03] via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FFFE9]/[0.025] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <div className="h-2 w-24 rounded-full bg-foreground/10 mb-2" />
              <div className="h-1.5 w-16 rounded-full bg-foreground/[0.06]" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--tiffany)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-[1.5px]" style={{ color: "var(--tiffany)", opacity: 0.6 }}>Live</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3 flex-1">
            {[
              { label: 'Monthly Rent', value: '₹50,000', accent: true },
              { label: 'Guaranteed Payout', value: '1st of Month', accent: false },
              { label: 'Settlement', value: '0% → 100%', accent: false },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-5 py-4 rounded-xl"
                style={{ border: "1px solid var(--border-subtle)", background: "rgba(128,128,128,0.04)" }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-bold tracking-tight ${row.accent ? 'text-foreground' : 'text-muted-foreground'}`}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 space-y-2 pt-2">
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[1px] text-muted-foreground">
              <span>Settlement Progress</span>
              <span>0% Settled</span>
            </div>
            <div className="w-full h-1 rounded-full bg-foreground/[0.06]">
              <div className="h-full w-0 bg-gradient-to-r from-[#6FFFE9]/40 to-[#6FFFE9] rounded-full" />
            </div>
          </div>

          <div className="absolute bottom-7 right-7 z-10">
            <div
              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[2px] text-black"
              style={{ background: 'linear-gradient(135deg, #888 0%, #D0D0D0 40%, #F0F0F0 55%, #B8B8B8 70%, #888 100%)' }}
            >
              Rent Guaranteed
            </div>
          </div>
        </div>
      </main>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.04] mb-10">
            <ArrowRight size={11} style={{ color: "var(--tiffany)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-[2px]" style={{ color: "var(--tiffany)", opacity: 0.7 }}>How it works</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text mb-20 leading-tight">
            Rent Now,<br />Pay Later.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            {/* Step 1 */}
            <div className="relative group">
              <div
                className="rounded-2xl p-8 md:p-10 h-full flex flex-col"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-start gap-6 mb-8">
                  <span
                    className="text-[88px] font-black leading-none select-none flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(111,255,233,0.15) 0%, rgba(111,255,233,0.55) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    1
                  </span>
                  {/* Visual: building + calendar */}
                  <div className="flex items-center gap-3 pt-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(111,255,233,0.07)", border: "1px solid rgba(111,255,233,0.18)" }}
                    >
                      <Building2 size={28} style={{ color: "#6FFFE9", opacity: 0.8 }} />
                    </div>
                    <div className="w-px h-8 opacity-20" style={{ background: "var(--tiffany)" }} />
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(111,255,233,0.04)", border: "1px solid rgba(111,255,233,0.14)" }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--tiffany)", opacity: 0.5 }}>1st</span>
                      <span className="text-xl font-black" style={{ color: "var(--tiffany)", opacity: 0.7 }}>1</span>
                    </div>
                  </div>
                </div>
                <p className="text-base md:text-lg font-light leading-relaxed text-muted-foreground">
                  We cover your rent upfront on the <span className="font-semibold" style={{ color: "var(--tiffany)", opacity: 0.8 }}>1st of the month</span> — guaranteed, every month.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div
                className="rounded-2xl p-8 md:p-10 h-full flex flex-col"
                style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-start gap-6 mb-8">
                  <span
                    className="text-[88px] font-black leading-none select-none flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(111,255,233,0.15) 0%, rgba(111,255,233,0.55) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    2
                  </span>
                  {/* Visual: split payments */}
                  <div className="flex items-center gap-2 pt-6">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(111,255,233,0.07)", border: "1px solid rgba(111,255,233,0.18)" }}
                    >
                      <div className="flex flex-col gap-1">
                        {[100, 70, 40].map((w, i) => (
                          <div key={i} className="h-1 rounded-full" style={{ width: `${w}%`, background: "#6FFFE9", opacity: 0.5 + i * 0.2 }} />
                        ))}
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: "var(--tiffany)", opacity: 0.4 }} />
                    <div className="flex flex-col gap-1.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-5 rounded px-2 flex items-center"
                          style={{
                            background: `rgba(111,255,233,${0.04 + i * 0.02})`,
                            border: "1px solid rgba(111,255,233,0.12)",
                            width: `${52 - i * 8}px`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-base md:text-lg font-light leading-relaxed text-muted-foreground">
                  Your tenant pays it back in <span className="font-semibold" style={{ color: "var(--tiffany)", opacity: 0.8 }}>smaller amounts</span> that fit their cash flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features-section" className="py-28 px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-16">
            <p className="text-[10px] font-semibold uppercase tracking-[2.5px] mb-4" style={{ color: "var(--tiffany)", opacity: 0.55 }}>Why RentFLO</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text max-w-lg leading-tight">
              Built for landlords who demand certainty.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            <FeatureCard
              icon={<Zap size={18} style={{ color: "var(--tiffany)" }} />}
              title={t("usp_1_title")}
              desc={t("usp_1_desc")}
              titleKey="usp_1_title"
              descKey="usp_1_desc"
            />
            <FeatureCard
              icon={<ShieldCheck size={18} style={{ color: "var(--tiffany)" }} />}
              title={t("usp_2_title")}
              desc={t("usp_2_desc")}
              titleKey="usp_2_title"
              descKey="usp_2_desc"
            />
            <FeatureCard
              icon={<Building2 size={18} style={{ color: "var(--tiffany)" }} />}
              title={t("usp_3_title")}
              desc={t("usp_3_desc")}
              titleKey="usp_3_title"
              descKey="usp_3_desc"
            />
            <FeatureCard
              icon={<Clock size={18} style={{ color: "var(--tiffany)" }} />}
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

      {/* ── For Tenants / For Properties ──────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* For Tenants */}
            <div
              className="relative rounded-2xl overflow-hidden flex flex-col justify-end"
              style={{
                minHeight: "340px",
                background: "linear-gradient(140deg, #0a0a1a 0%, #0d1535 40%, #0f1a40 100%)",
                border: "1px solid rgba(111,255,233,0.12)",
              }}
            >
              {/* Background grid pattern */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(rgba(111,255,233,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(111,255,233,0.04) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              {/* Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(111,255,233,0.06)" }} />

              {/* Icon illustration */}
              <div className="absolute top-8 right-8 opacity-20">
                <Users size={96} strokeWidth={1} style={{ color: "#6FFFE9" }} />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 md:p-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">For Tenants</h3>
                <a
                  href="/api/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#000",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
                >
                  Learn More <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* For Properties */}
            <div
              className="relative rounded-2xl overflow-hidden flex flex-col justify-end"
              style={{
                minHeight: "340px",
                background: "linear-gradient(140deg, #080812 0%, #0b1128 40%, #0d1535 100%)",
                border: "1px solid rgba(111,255,233,0.08)",
              }}
            >
              {/* Background grid pattern */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(rgba(111,255,233,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(111,255,233,0.03) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              {/* Glow */}
              <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(111,255,233,0.04)" }} />

              {/* Icon illustration */}
              <div className="absolute top-8 right-8 opacity-15">
                <Home size={96} strokeWidth={1} style={{ color: "#6FFFE9" }} />
              </div>
              {/* Secondary icon */}
              <div className="absolute top-12 right-20 opacity-10">
                <Building2 size={64} strokeWidth={1} style={{ color: "#6FFFE9" }} />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 md:p-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">For Properties</h3>
                <a
                  href="/api/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    color: "#000",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.95)")}
                >
                  Learn More <ArrowRight size={14} />
                </a>
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
      <section className="py-28 px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.04] mb-10">
            <ArrowRight size={11} style={{ color: "var(--tiffany)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-[2px]" style={{ color: "var(--tiffany)", opacity: 0.7 }}>FAQ</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text mb-16 leading-tight max-w-lg">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl space-y-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} question={item.question} answer={item.answer} />
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
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/refund" className="hover:text-foreground transition-colors">Refund</a>
            <a href="/support" className="hover:text-foreground transition-colors">Support</a>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
            <ShieldCheck size={11} />
            <span>Bank-Grade Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ Data ───────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What does it mean to split rent payments?",
    answer: "RentFLO advances the full rent to your landlord on the 1st of each month. You then repay that amount in smaller instalments across the month — weekly or bi-weekly — so your cash flow stays healthy.",
  },
  {
    question: "How can I pay my rent using flexible payment options?",
    answer: "Once you're onboarded as a tenant on RentFLO, you can choose how many instalments to split your rent into. Payments are made securely via Razorpay using UPI, cards, or net banking.",
  },
  {
    question: "Are there extra fees when I split my rent?",
    answer: "RentFLO charges a small platform fee for the advance service. There are no hidden charges. The fee is shown clearly before you confirm your payment plan.",
  },
  {
    question: "Can I use credit to cover rent payments?",
    answer: "Yes. RentFLO acts as the credit bridge between you and your landlord. We advance the full rent on your behalf, so you can pay it back when it suits you during the month.",
  },
  {
    question: "Why choose flexible payment plans instead of traditional rent terms?",
    answer: "Traditional rent is due in one lump sum — often right after payday gaps. RentFLO's flexible plans align your rent payments with your income schedule, reducing financial stress without involving your landlord.",
  },
];

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
            color: open ? "#6FFFE9" : "var(--nav-text-dim)",
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

function FeatureCard({ icon, title, desc, titleKey, descKey }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  titleKey: string;
  descKey: string;
}) {
  return (
    <div className="bg-background p-8 md:p-10 group hover:bg-card transition-colors duration-300">
      <div
        className="mb-5 inline-flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-300"
        style={{ border: "1px solid var(--border-accent-dim)", background: "rgba(111,255,233,0.04)" }}
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
