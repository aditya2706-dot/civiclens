"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "hi";

const translations = {
    en: {
        // Home Page
        appName: "CivicAI",
        tagline: "Your City, Better",
        unresolvedNear: "unresolved issues near you",
        loading: "...",

        // Bottom Nav
        navMap: "Map",
        navReport: "Report",
        navReports: "Reports",
        navLeaderboard: "Top",
        navSettings: "Account",

        // Category Filter
        catAll: "All",
        catLitter: "Litter",
        catOpenDump: "Open Dump",
        catPothole: "Pothole",
        catStreetlight: "Streetlight",
        catSewage: "Sewage",
        catOther: "Other",

        // Report Wizard
        reportTitle: "Report an Issue",
        reportStep1: "Upload Photo",
        reportStep2: "AI Analysis",
        reportStep3: "Confirm & Submit",
        reportSubmit: "Submit Report",
        reportAnon: "Submit Anonymously",

        // Reports List
        reportsTitle: "All Reports",
        statusPending: "Pending",
        statusUnderReview: "Under Review",
        statusResolved: "Resolved",

        // Report Detail
        aiAnalysis: "AI Analysis",
        assignedTo: "Assigned to:",
        meToo: "I face this issue too",
        communityVerify: "Community Verification",
        shareTitle: "Make Some Noise!",
        shareSubtitle: "Share this report to get it fixed faster",
        whatsapp: "WhatsApp",
        twitter: "Twitter",
        copyLink: "Copy Link",
        shareOptions: "Share Options",
        resolutionProof: "Official Resolution Proof",
        viewOnMap: "View on Map",
        discussion: "Discussion",
        addComment: "Add a comment or update...",
        noComments: "No comments yet. Start the conversation!",
        official: "Official",

        // Auth
        login: "Log In",
        register: "Register",
        logout: "Log Out",
        name: "Name",
        email: "Email",
        password: "Password",
        phone: "Phone",
        
        // Leaderboard
        leaderboardTitle: "Civic Champions",
        leaderboardSubtitle: "Citizens making a difference",
        points: "points",

        // Settings
        settingsTitle: "My Account",
        myReports: "My Reports",
        myPoints: "My Points",
        loginToView: "Please login to view your profile.",
        loginButton: "Login / Register",

        // Sharing / Notifications
        notifTitle: "Notifications",
        markAllRead: "Mark all as read",
        noNotif: "No new notifications",
    },
    hi: {
        // Home Page
        appName: "CivicAI",
        tagline: "आपका शहर, बेहतर",
        unresolvedNear: "अनसुलझी समस्याएं आपके पास",
        loading: "...",

        // Bottom Nav
        navMap: "मानचित्र",
        navReport: "रिपोर्ट",
        navReports: "सूची",
        navLeaderboard: "शीर्ष",
        navSettings: "खाता",

        // Category Filter
        catAll: "सभी",
        catLitter: "कचरा",
        catOpenDump: "खुला डंप",
        catPothole: "गड्ढा",
        catStreetlight: "स्ट्रीटलाइट",
        catSewage: "सीवेज",
        catOther: "अन्य",

        // Report Wizard
        reportTitle: "समस्या रिपोर्ट करें",
        reportStep1: "फ़ोटो अपलोड करें",
        reportStep2: "AI विश्लेषण",
        reportStep3: "पुष्टि करें और सबमिट करें",
        reportSubmit: "रिपोर्ट सबमिट करें",
        reportAnon: "गुमनाम सबमिट करें",

        // Reports List
        reportsTitle: "सभी रिपोर्टें",
        statusPending: "लंबित",
        statusUnderReview: "समीक्षाधीन",
        statusResolved: "हल हो गया",

        // Report Detail
        aiAnalysis: "AI विश्लेषण",
        assignedTo: "को सौंपा गया:",
        meToo: "मुझे भी यह समस्या है",
        communityVerify: "सामुदायिक सत्यापन",
        shareTitle: "आवाज़ उठाएं!",
        shareSubtitle: "इस रिपोर्ट को शेयर करें ताकि जल्दी ठीक हो",
        whatsapp: "व्हाट्सऐप",
        twitter: "Twitter",
        copyLink: "लिंक कॉपी करें",
        shareOptions: "शेयर करें",
        resolutionProof: "आधिकारिक समाधान प्रमाण",
        viewOnMap: "मानचित्र पर देखें",
        discussion: "चर्चा",
        addComment: "टिप्पणी या अपडेट जोड़ें...",
        noComments: "अभी तक कोई टिप्पणी नहीं। बातचीत शुरू करें!",
        official: "अधिकारी",

        // Auth
        login: "लॉग इन",
        register: "पंजीकरण",
        logout: "लॉग आउट",
        name: "नाम",
        email: "ईमेल",
        password: "पासवर्ड",
        phone: "फ़ोन",

        // Leaderboard
        leaderboardTitle: "नागरिक चैंपियंस",
        leaderboardSubtitle: "बदलाव लाने वाले नागरिक",
        points: "अंक",

        // Settings
        settingsTitle: "मेरा खाता",
        myReports: "मेरी रिपोर्टें",
        myPoints: "मेरे अंक",
        loginToView: "प्रोफ़ाइल देखने के लिए लॉगिन करें।",
        loginButton: "लॉगिन / पंजीकरण",

        // Sharing / Notifications
        notifTitle: "सूचनाएं",
        markAllRead: "सभी पढ़े हुए चिह्नित करें",
        noNotif: "कोई नई सूचना नहीं",
    }
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: "en",
    setLang: () => {},
    t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Language>("en");

    const t = (key: TranslationKey): string => {
        return (translations[lang] as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
