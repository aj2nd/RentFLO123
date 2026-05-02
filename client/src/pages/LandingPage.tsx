import { ArrowRight, ShieldCheck, Zap, Building2, Clock } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-black text-zinc-300">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <main className="px-8 md:px-16 max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[82vh] pt-20 pb-24">

        <div className="space-y-10">
          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 border border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6FFFE9] animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#6FFFE9]/70">
              Rent Payment Platform
            </span>
          </div>

          {/* Hero headline */}
          <div className="space-y-1">
            <h1 className="text-[72px] md:text-[96px] font-bold tracking-[-4px] leading-[0.88] silver-text glow-text select-none">
              NEVER
            </h1>
            <h1 className="text-[72px] md:text-[96px] font-bold tracking-[-4px] leading-[0.88] silver-text glow-text select-none">
              CHASE
            </h1>
            <h1 className="text-[72px] md:text-[96px] font-bold tracking-[-4px] leading-[0.88] silver-text glow-text select-none">
              RENT.
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/40 font-light leading-relaxed max-w-sm border-l border-[#6FFFE9]/30 pl-5" style={{ borderLeftWidth: '2px' }}>
            <span data-i18n="we_pay_your_rent">{t("we_pay_your_rent")}</span><br />
            <span data-i18n="your_tenant_pays_later">{t("your_tenant_pays_later")}</span><br />
            <span className="text-[#6FFFE9]/60" data-i18n="zero_friction">{t("zero_friction")}</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center h-13 px-9 font-bold text-sm tracking-[0.06em] uppercase transition-all duration-200 group"
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
            <button
              onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center h-13 px-9 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 hover:bg-white/[0.03] transition-all duration-200 font-medium text-sm tracking-[0.04em] uppercase"
              style={{ height: '52px' }}
              data-testid="button-view-demo"
            >
              <span data-i18n="view_demo">{t("view_demo")}</span>
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-white/25">
              <ShieldCheck size={13} />
              <span className="text-[11px] font-medium tracking-wide uppercase">Bank-Grade Security</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-white/25">
              <Zap size={13} />
              <span className="text-[11px] font-medium tracking-wide uppercase">Instant Payout</span>
            </div>
          </div>
        </div>

        {/* ── Dashboard preview card ─────────────────────── */}
        <div className="relative hidden lg:flex flex-col gap-4 p-8 bg-zinc-950 border border-white/[0.06] overflow-hidden" style={{ minHeight: '540px' }}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6FFFE9]/[0.03] via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FFFE9]/[0.025] rounded-full blur-3xl pointer-events-none" />

          {/* Card header */}
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <div className="h-2 w-24 bg-white/10 mb-2" />
              <div className="h-1.5 w-16 bg-white/[0.06]" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#6FFFE9] animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-[#6FFFE9]/60">Live</span>
            </div>
          </div>

          {/* Metric rows */}
          <div className="relative z-10 flex flex-col gap-3 flex-1">
            {[
              { label: 'Monthly Rent', value: '₹50,000', accent: true },
              { label: 'Guaranteed Payout', value: '1st of Month', accent: false },
              { label: 'Settlement', value: '0% → 100%', accent: false },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border border-white/[0.05] bg-black/40">
                <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-white/30">{row.label}</span>
                <span className={`text-sm font-bold tracking-tight ${row.accent ? 'text-white' : 'text-white/55'}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="relative z-10 space-y-2 pt-2">
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[1px] text-white/25">
              <span>Settlement Progress</span>
              <span>0% Settled</span>
            </div>
            <div className="w-full h-1 bg-white/[0.06]">
              <div className="h-full w-0 bg-gradient-to-r from-[#6FFFE9]/40 to-[#6FFFE9]" />
            </div>
          </div>

          {/* Stamp */}
          <div className="absolute bottom-7 right-7 z-10">
            <div
              className="px-4 py-2 text-[10px] font-black uppercase tracking-[2px] text-black"
              style={{ background: 'linear-gradient(135deg, #888 0%, #D0D0D0 40%, #F0F0F0 55%, #B8B8B8 70%, #888 100%)' }}
            >
              Rent Guaranteed
            </div>
          </div>
        </div>
      </main>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features-section" className="py-28 px-8 md:px-16">
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-16">
            <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[#6FFFE9]/50 mb-4">Why RentFLO</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-[-2px] silver-text max-w-lg leading-tight">
              Built for landlords who demand certainty.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.05]">
            <FeatureCard
              icon={<Zap size={18} className="text-[#6FFFE9]/70" />}
              title={t("usp_1_title")}
              desc={t("usp_1_desc")}
              titleKey="usp_1_title"
              descKey="usp_1_desc"
            />
            <FeatureCard
              icon={<ShieldCheck size={18} className="text-[#6FFFE9]/70" />}
              title={t("usp_2_title")}
              desc={t("usp_2_desc")}
              titleKey="usp_2_title"
              descKey="usp_2_desc"
            />
            <FeatureCard
              icon={<Building2 size={18} className="text-[#6FFFE9]/70" />}
              title={t("usp_3_title")}
              desc={t("usp_3_desc")}
              titleKey="usp_3_title"
              descKey="usp_3_desc"
            />
            <FeatureCard
              icon={<Clock size={18} className="text-[#6FFFE9]/70" />}
              title={t("usp_4_title")}
              desc={t("usp_4_desc")}
              titleKey="usp_4_title"
              descKey="usp_4_desc"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="px-8 md:px-16 pb-24">
        <div className="max-w-screen-xl mx-auto h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-12" />
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/20 font-medium tracking-wide">
            © {new Date().getFullYear()} RentFLO Technologies Pvt. Ltd.
          </p>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.5px] text-white/15">
            <ShieldCheck size={11} />
            <span>Bank-Grade Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, titleKey, descKey }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  titleKey: string;
  descKey: string;
}) {
  return (
    <div className="bg-black p-8 md:p-10 group hover:bg-zinc-950 transition-colors duration-300">
      <div className="mb-5 inline-flex items-center justify-center w-10 h-10 border border-[#6FFFE9]/15 bg-[#6FFFE9]/[0.04] group-hover:border-[#6FFFE9]/30 transition-colors duration-300">
        {icon}
      </div>
      <h3
        className="text-lg md:text-xl font-bold tracking-tight silver-text mb-3 leading-snug"
        data-i18n={titleKey}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-white/30 font-light" data-i18n={descKey}>
        {desc}
      </p>
    </div>
  );
}
