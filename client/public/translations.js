// RentFLO Internationalization Translations
// Supports: English (en), Hindi (hi), Kannada (kn)

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
    get_started: "Get Started",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refund: "Cancellation & Refund",
    contact_support: "Contact Support"
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
    terms: "सेवा की शर्तें",
    privacy: "गोपनीयता नीति",
    refund: "रद्दीकरण और धनवापसी",
    contact_support: "सहायता से संपर्क करें"
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
    terms: "ಸೇವಾ ನಿಯಮಗಳು",
    privacy: "ಗೌಪ್ಯತಾ ನೀತಿ",
    refund: "ರದ್ದು ಮತ್ತು ಮರುಪಾವತಿ",
    contact_support: "ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಿ"
  }
};

// Export to window for browser script access
if (typeof window !== 'undefined') {
  window.translations = translations;
}

// Export for ES modules (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations };
}
