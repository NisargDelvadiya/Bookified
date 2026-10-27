'use client';

import { useAuth, useUser } from "@clerk/nextjs";
import { PLANS, PLAN_LIMITS, PLAN_DETAILS } from "@/lib/subscription-constants";

export const useSubscription = () => {
    const { has, isLoaded: isAuthLoaded } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();

    const isLoaded = isAuthLoaded && isUserLoaded;

    if (!isLoaded) {
        return {
            plan: PLANS.FREE,
            limits: PLAN_LIMITS[PLANS.FREE],
            details: PLAN_DETAILS[PLANS.FREE],
            isFree: true,
            isStandard: false,
            isPro: false,
            isLoaded: false,
        };
    }

    let plan = PLANS.FREE;

    // 1. Clerk user public metadata (set via Razorpay verification)
    const metadataPlan = (
        user?.publicMetadata?.plan ||
        user?.publicMetadata?.billingPlan
    )?.toString().toLowerCase();

    if (metadataPlan === "pro") {
        plan = PLANS.PRO;
    } else if (metadataPlan === "standard") {
        plan = PLANS.STANDARD;
    } else if (has?.({ product: "pro" }) || has?.({ plan: "pro" })) {
        plan = PLANS.PRO;
    } else if (has?.({ product: "standard" }) || has?.({ plan: "standard" })) {
        plan = PLANS.STANDARD;
    }

    return {
        plan,
        limits: PLAN_LIMITS[plan] || PLAN_LIMITS[PLANS.FREE],
        details: PLAN_DETAILS[plan] || PLAN_DETAILS[PLANS.FREE],
        isFree: plan === PLANS.FREE,
        isStandard: plan === PLANS.STANDARD,
        isPro: plan === PLANS.PRO,
        isLoaded: true,
    };
};
