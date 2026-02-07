import { useState, useEffect, useCallback } from 'react';

// Translation data matching translations.js
const translations = {
  en: {
    home: "Home",
    settings: "Settings",
    welcome_message: "Welcome to RentFLO",
    login: "Login",
    change_language: "Change Language",
    dashboard: "Dashboard",
    tenant: "Tenant",
    owner: "Owner",
    admin: "Admin",
    properties: "Properties",
    payments: "Payments",
    support: "Support",
    logout: "Logout",
    never_chase_rent: "Never Chase Rent",
    we_pay_your_rent: "We pay your rent on the 1st.",
    your_tenant_pays_later: "Your tenant pays us later.",
    zero_friction: "Zero friction.",
    get_started: "GET STARTED",
    view_demo: "VIEW DEMO",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Cancellation & Refund",
    contact_support: "Contact Support",
    usp_1_title: "Get Your Rent on Time",
    usp_1_desc: "Rent credited on the 1st, every month.",
    usp_2_title: "Zero Risk",
    usp_2_desc: "You get paid even if the tenant delays or leaves.",
    usp_3_title: "Easy Repairs & Maintenance",
    usp_3_desc: "We manage repairs from start to finish.",
    usp_4_title: "No Tenant Chasing",
    usp_4_desc: "We handle all follow-ups and disputes for you."
  },
  hi: {
    home: "होम",
    settings: "सेटिंग्स",
    welcome_message: "RentFLO में आपका स्वागत है",
    login: "लॉगिन",
    change_language: "भाषा बदलें",
    dashboard: "डैशबोर्ड",
    tenant: "किराएदार",
    owner: "मालिक",
    admin: "व्यवस्थापक",
    properties: "संपत्तियाँ",
    payments: "भुगतान",
    support: "सहायता",
    logout: "लॉगआउट",
    never_chase_rent: "किराए के पीछे कभी न भागें",
    we_pay_your_rent: "हम पहली तारीख को आपका किराया देते हैं।",
    your_tenant_pays_later: "आपका किराएदार बाद में हमें भुगतान करता है।",
    zero_friction: "बिल्कुल आसान।",
    get_started: "शुरू करें",
    view_demo: "डेमो देखें",
    terms: "सेवा की शर्तें",
    privacy: "गोपनीयता नीति",
    refund: "रद्दीकरण और धनवापसी",
    contact_support: "सहायता से संपर्क करें",
    usp_1_title: "समय पर किराया पाएँ",
    usp_1_desc: "हर महीने पहली तारीख को किराया जमा।",
    usp_2_title: "शून्य जोखिम",
    usp_2_desc: "किराएदार देरी करे या छोड़ दे, आपको भुगतान मिलेगा।",
    usp_3_title: "आसान मरम्मत और रखरखाव",
    usp_3_desc: "हम शुरू से अंत तक मरम्मत का प्रबंधन करते हैं।",
    usp_4_title: "किराएदार के पीछे न भागें",
    usp_4_desc: "सभी फॉलो-अप और विवाद हम संभालते हैं।"
  },
  kn: {
    home: "ಮುಖಪುಟ",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    welcome_message: "RentFLO ಗೆ ಸ್ವಾಗತ",
    login: "ಲಾಗಿನ್",
    change_language: "ಭಾಷೆ ಬದಲಾಯಿಸಿ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    tenant: "ಬಾಡಿಗೆದಾರ",
    owner: "ಮಾಲೀಕ",
    admin: "ನಿರ್ವಾಹಕ",
    properties: "ಆಸ್ತಿಗಳು",
    payments: "ಪಾವತಿಗಳು",
    support: "ಬೆಂಬಲ",
    logout: "ಲಾಗ್ಔಟ್",
    never_chase_rent: "ಬಾಡಿಗೆ ಹಿಂದೆ ಓಡಬೇಡಿ",
    we_pay_your_rent: "ನಾವು 1ನೇ ತಾರೀಖು ನಿಮ್ಮ ಬಾಡಿಗೆ ಪಾವತಿಸುತ್ತೇವೆ.",
    your_tenant_pays_later: "ನಿಮ್ಮ ಬಾಡಿಗೆದಾರರು ನಂತರ ನಮಗೆ ಪಾವತಿಸುತ್ತಾರೆ.",
    zero_friction: "ಯಾವುದೇ ತೊಂದರೆಯಿಲ್ಲ.",
    get_started: "ಪ್ರಾರಂಭಿಸಿ",
    view_demo: "ಡೆಮೊ ನೋಡಿ",
    terms: "ಸೇವಾ ನಿಯಮಗಳು",
    privacy: "ಗೌಪ್ಯತಾ ನೀತಿ",
    refund: "ರದ್ದು ಮತ್ತು ಮರುಪಾವತಿ",
    contact_support: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ",
    usp_1_title: "ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬಾಡಿಗೆ ಪಡೆಯಿರಿ",
    usp_1_desc: "ಪ್ರತಿ ತಿಂಗಳ 1ನೇ ತಾರೀಖು ಬಾಡಿಗೆ ಜಮಾ.",
    usp_2_title: "ಶೂನ್ಯ ಅಪಾಯ",
    usp_2_desc: "ಬಾಡಿಗೆದಾರರು ವಿಳಂಬಿಸಿದರೂ ಅಥವಾ ಬಿಟ್ಟರೂ ನಿಮಗೆ ಪಾವತಿ ಸಿಗುತ್ತದೆ.",
    usp_3_title: "ಸುಲಭ ದುರಸ್ತಿ ಮತ್ತು ನಿರ್ವಹಣೆ",
    usp_3_desc: "ನಾವು ಆರಂಭದಿಂದ ಕೊನೆಯವರೆಗೆ ದುರಸ್ತಿ ನಿರ್ವಹಿಸುತ್ತೇವೆ.",
    usp_4_title: "ಬಾಡಿಗೆದಾರರ ಹಿಂದೆ ಓಡಬೇಡಿ",
    usp_4_desc: "ಎಲ್ಲಾ ಫಾಲೋ-ಅಪ್ ಮತ್ತು ವಿವಾದಗಳನ್ನು ನಾವು ನಿಭಾಯಿಸುತ್ತೇವೆ."
  }
} as const;

type Language = 'en' | 'hi' | 'kn';
type TranslationKey = keyof typeof translations.en;

const STORAGE_KEY = 'rentflo_language';
const DEFAULT_LANG: Language = 'en';

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'hi', 'kn'].includes(saved)) {
      return saved as Language;
    }
  } catch (e) {
    // localStorage not available
  }
  return DEFAULT_LANG;
}

export function useI18n() {
  const [language, setLanguageState] = useState<Language>(getSavedLanguage);

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // localStorage not available
    }
    setLanguageState(lang);
    document.documentElement.lang = lang;
    
    // Sync with the header select element
    const select = document.getElementById('language-select') as HTMLSelectElement | null;
    if (select) {
      select.value = lang;
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language]?.[key] || translations[DEFAULT_LANG][key] || key;
  }, [language]);

  // Listen for language changes from the header select
  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent<{ lang: Language }>) => {
      setLanguageState(e.detail.lang);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  // Sync with stored language on mount
  useEffect(() => {
    const stored = getSavedLanguage();
    if (stored !== language) {
      setLanguageState(stored);
    }
    document.documentElement.lang = stored;
  }, []);

  return {
    language,
    setLanguage,
    t,
    translations: translations[language]
  };
}

export { translations };
export type { Language, TranslationKey };
