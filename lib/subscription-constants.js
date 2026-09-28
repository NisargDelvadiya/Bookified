export const PLANS = {
    FREE: 'free',
    STANDARD: 'standard',
    PRO: 'pro',
};

export const PLAN_LIMITS = {
    [PLANS.FREE]: {
        maxBooks: 100,
        maxSessionsPerMonth: 1000,
        maxDurationPerSession: 60,
        hasSessionHistory: true,
    },
    [PLANS.STANDARD]: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxDurationPerSession: 15,
        hasSessionHistory: true,
    },
    [PLANS.PRO]: {
        maxBooks: 100,
        maxSessionsPerMonth: Infinity,
        maxDurationPerSession: 60,
        hasSessionHistory: true,
    },
};

export const getCurrentBillingPeriodStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};
