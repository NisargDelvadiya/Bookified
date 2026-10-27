import { auth } from "@clerk/nextjs/server";
import { PLANS, PLAN_LIMITS, PLAN_DETAILS } from "@/lib/subscription-constants";
import { connectToDatabase } from "@/database/mongoose";
import Subscription from "@/database/models/subscription.model";

export const getUserPlan = async () => {
    try {
        const { userId, sessionClaims } = await auth();

        if (!userId) return PLANS.FREE;

        // 1. Check Clerk sessionClaims public metadata
        const metadataPlan = (
            sessionClaims?.publicMetadata?.plan ||
            sessionClaims?.metadata?.plan
        )?.toString().toLowerCase();

        if (metadataPlan === PLANS.PRO) return PLANS.PRO;
        if (metadataPlan === PLANS.STANDARD) return PLANS.STANDARD;

        // 2. Query MongoDB for active subscription
        try {
            await connectToDatabase();
            const activeSub = await Subscription.findOne({
                clerkId: userId,
                status: "active",
                currentPeriodEnd: { $gte: new Date() },
            }).sort({ createdAt: -1 }).lean();

            if (activeSub && (activeSub.plan === PLANS.PRO || activeSub.plan === PLANS.STANDARD)) {
                return activeSub.plan;
            }
        } catch (dbErr) {
            console.warn("DB subscription check error:", dbErr);
        }

        return PLANS.FREE;
    } catch (e) {
        console.error("getUserPlan error:", e);
        return PLANS.FREE;
    }
};

export const getPlanLimits = async () => {
    const plan = await getUserPlan();
    return PLAN_LIMITS[plan] || PLAN_LIMITS[PLANS.FREE];
};

export const getUserSubscriptionDetails = async () => {
    try {
        const { userId } = await auth();
        if (!userId) return null;

        await connectToDatabase();
        const activeSub = await Subscription.findOne({
            clerkId: userId,
            status: "active",
        }).sort({ createdAt: -1 }).lean();

        if (!activeSub) {
            return {
                plan: PLANS.FREE,
                details: PLAN_DETAILS[PLANS.FREE],
                limits: PLAN_LIMITS[PLANS.FREE],
                activeSubscription: null,
            };
        }

        const isExpired = new Date(activeSub.currentPeriodEnd) < new Date();
        const effectivePlan = isExpired ? PLANS.FREE : (activeSub.plan || PLANS.FREE);

        return {
            plan: effectivePlan,
            details: PLAN_DETAILS[effectivePlan],
            limits: PLAN_LIMITS[effectivePlan],
            activeSubscription: {
                ...activeSub,
                _id: activeSub._id.toString(),
                isExpired,
            },
        };
    } catch (e) {
        console.error("getUserSubscriptionDetails error:", e);
        return null;
    }
};
