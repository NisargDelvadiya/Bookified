export const PLANS = {
    FREE: "free",
    STANDARD: "standard",
    PRO: "pro",
};

export const PLAN_LIMITS = {
    [PLANS.FREE]: {
        maxBooks: 3,
        maxSessionsPerMonth: 15,
        maxDurationPerSession: 15,
        hasSessionHistory: true,
    },
    [PLANS.STANDARD]: {
        maxBooks: 25,
        maxSessionsPerMonth: 150,
        maxDurationPerSession: 30,
        hasSessionHistory: true,
    },
    [PLANS.PRO]: {
        maxBooks: 500,
        maxSessionsPerMonth: Infinity,
        maxDurationPerSession: 60,
        hasSessionHistory: true,
    },
};

export const PLAN_DETAILS = {
    [PLANS.FREE]: {
        id: PLANS.FREE,
        name: "Free Starter",
        tagline: "Ideal for casual readers exploring interactive AI book chat",
        priceMonthly: 0,
        priceYearly: 0,
        badge: null,
        isPopular: false,
        features: [
            { text: "Up to 3 PDF book uploads", included: true },
            { text: "15 minutes per voice conversation", included: true },
            { text: "15 interactive voice sessions / month", included: true },
            { text: "Standard AI voice engine", included: true },
            { text: "Full transcript access & reading history", included: true },
            { text: "Ultra-realistic ElevenLabs voices", included: false },
            { text: "Smart chapter auto-segmentation", included: false },
            { text: "Priority 24/7 dedicated support", included: false },
        ],
    },
    [PLANS.STANDARD]: {
        id: PLANS.STANDARD,
        name: "Standard Reader",
        tagline: "For passionate readers who want deeper voice conversations",
        priceMonthly: 499,
        priceYearly: 4499,
        monthlyEquivalentYearly: 375,
        badge: "Recommended for Students",
        isPopular: false,
        features: [
            { text: "Up to 25 PDF book uploads", included: true },
            { text: "30 minutes per voice conversation", included: true },
            { text: "150 voice sessions / month", included: true },
            { text: "Natural synthetic voices & custom personas", included: true },
            { text: "20+ Indian language translations & audio", included: true },
            { text: "Lightning fast MongoDB full-text search", included: true },
            { text: "Smart chapter summaries & key points", included: true },
            { text: "Priority customer support", included: true },
        ],
    },
    [PLANS.PRO]: {
        id: PLANS.PRO,
        name: "Pro Bibliophile",
        tagline: "Unlimited power for avid scholars, researchers, and professionals",
        priceMonthly: 999,
        priceYearly: 8999,
        monthlyEquivalentYearly: 749,
        badge: "⭐ Most Popular",
        isPopular: true,
        features: [
            { text: "Up to 500 PDF book uploads (Unlimited)", included: true },
            { text: "60 minutes maximum voice duration", included: true },
            { text: "Unlimited voice sessions / month", included: true },
            { text: "All Ultra-Realistic AI Voice Personas", included: true },
            { text: "Deep chapter intelligent segmentation", included: true },
            { text: "Export summaries & conversational transcripts", included: true },
            { text: "Early access to upcoming features", included: true },
            { text: "Dedicated 24/7 VIP assistance", included: true },
        ],
    },
};

export const getCurrentBillingPeriodStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};

export const calculatePeriodEnd = (billingCycle = "monthly", fromDate = new Date()) => {
    const date = new Date(fromDate);
    if (billingCycle === "yearly") {
        date.setFullYear(date.getFullYear() + 1);
    } else {
        date.setMonth(date.getMonth() + 1);
    }
    return date;
};
