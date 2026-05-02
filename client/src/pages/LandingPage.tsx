import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import houseLogoImg from "@assets/IMG_7223_1777731010120.jpeg";
import wordmarkImg from "@assets/IMG_7224_1777731010120.jpeg";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-[#C0C0C0] selection:text-black">
      {/* Nav */}
      <nav className="fixed w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-sm border-b border-[#6FFFE9]/15">
        <div className="flex items-center gap-2">
          <img src={houseLogoImg} alt="RentFLO" className="w-8 h-8 object-contain flex-shrink-0" data-testid="logo-landing" />
          <img src={wordmarkImg} alt="RentFLO" className="h-7 object-contain" />
        </div>
        <a
          href="/api/login"
          className="px-6 py-2 font-medium text-sm rounded-none transition-all"
          style={{ background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)', color: '#000' }}
          data-testid="link-login"
          data-i18n="login"
        >
          {t("login")}
        </a>
      </nav>

      {/* Hero */}
      <main className="pt-32 pb-20 px-6 md:px-12 max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
        <div className="space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] silver-text glow-text">
            NEVER<br />
            CHASE<br />
            RENT.
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 font-light max-w-md border-l-2 border-[#6FFFE9]/40 pl-6">
            <span data-i18n="we_pay_your_rent">{t("we_pay_your_rent")}</span> <br/>
            <span data-i18n="your_tenant_pays_later">{t("your_tenant_pays_later")}</span> <br/>
            <span data-i18n="zero_friction">{t("zero_friction")}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <a
              href="/api/login"
              className="inline-flex items-center justify-center h-14 px-8 font-bold text-lg tracking-tight transition-all group rounded-none"
              style={{ background: 'linear-gradient(135deg, #7A7A7A 0%, #C8C8C8 35%, #EFEFEF 50%, #B4B4B4 70%, #7A7A7A 100%)', color: '#000' }}
              data-testid="button-get-started"
            >
              <span data-i18n="get_started">{t("get_started")}</span>
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={() => {
                const section = document.getElementById('features-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center h-14 px-8 border border-[#6FFFE9]/35 text-[#9DEFE4] hover:text-[#6FFFE9] hover:border-[#6FFFE9]/65 hover:bg-[#6FFFE9]/5 transition-all font-medium rounded-none"
              data-testid="button-view-demo"
            >
              <span data-i18n="view_demo">{t("view_demo")}</span>
            </button>
          </div>
        </div>

        {/* Abstract UI preview card */}
        <div className="relative hidden lg:block h-[600px] w-full bg-zinc-950 border border-[#6FFFE9]/12 p-8 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-950 to-[#041815]/40 opacity-80" />
          <div className="relative z-10 space-y-6">
            <div className="w-full h-40 border border-[#6FFFE9]/12 bg-black/50 backdrop-blur-md p-6 flex flex-col justify-between group-hover:translate-y-[-5px] transition-transform duration-500">
              <div className="flex justify-between">
                <div className="h-2 w-20 bg-zinc-700"></div>
                <div className="h-2 w-2 bg-[#6FFFE9] animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-10 w-48 bg-zinc-800"></div>
                <div className="h-3 w-32 bg-[#6FFFE9]/15"></div>
              </div>
            </div>
            <div className="w-full h-40 border border-[#6FFFE9]/8 bg-black/50 backdrop-blur-md p-6 flex flex-col justify-between group-hover:translate-y-[-5px] transition-transform duration-500 delay-100">
              <div className="flex justify-between">
                <div className="h-2 w-20 bg-zinc-700"></div>
                <div className="h-2 w-2 bg-[#6FFFE9]/40"></div>
              </div>
              <div className="space-y-2">
                <div className="h-10 w-32 bg-zinc-800"></div>
                <div className="h-3 w-24 bg-[#6FFFE9]/12"></div>
              </div>
            </div>
            <div className="absolute bottom-8 right-8">
              <div
                className="px-4 py-2 text-black text-xs font-bold uppercase tracking-wider"
                style={{ background: 'linear-gradient(135deg, #888 0%, #D0D0D0 40%, #F0F0F0 55%, #B8B8B8 70%, #888 100%)' }}
              >
                Rent Guaranteed
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="features-section" className="py-24 px-6 md:px-12 border-t border-[#6FFFE9]/12">
        <div className="max-w-3xl mx-auto flex flex-col" style={{ gap: '48px' }}>
          <Feature title={t("usp_1_title")} desc={t("usp_1_desc")} titleKey="usp_1_title" descKey="usp_1_desc" />
          <Feature title={t("usp_2_title")} desc={t("usp_2_desc")} titleKey="usp_2_title" descKey="usp_2_desc" />
          <Feature title={t("usp_3_title")} desc={t("usp_3_desc")} titleKey="usp_3_title" descKey="usp_3_desc" />
          <Feature title={t("usp_4_title")} desc={t("usp_4_desc")} titleKey="usp_4_title" descKey="usp_4_desc" />
        </div>
      </section>

      <footer className="py-12 px-6 md:px-12 border-t border-[#6FFFE9]/12 text-center text-zinc-600 text-sm">
        <p>© 2025 RentFLO Operating System. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Feature({ title, desc, titleKey, descKey }: { title: string; desc: string; titleKey: string; descKey: string }) {
  return (
    <div className="flex items-start gap-5">
      <div className="flex-shrink-0 mt-1">
        <CheckCircle2 className="w-7 h-7 text-[#6FFFE9]" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-xl md:text-2xl tracking-tight silver-text" style={{ fontWeight: 800 }} data-i18n={titleKey}>{title}</h3>
        <p className="mt-2 text-base leading-relaxed text-zinc-500" data-i18n={descKey}>{desc}</p>
      </div>
    </div>
  );
}
