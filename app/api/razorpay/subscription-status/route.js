import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import Subscription from "@/database/models/subscription.model";
import { PLAN_DETAILS, PLANS } from "@/lib/subscription-constants";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({
                authenticated: false,
                plan: PLANS.FREE,
                details: PLAN_DETAILS[PLANS.FREE],
                subscription: null,
            });
        }

        await connectToDatabase();
        const activeSub = await Subscription.findOne({
            clerkId: userId,
            status: "active",
        }).sort({ createdAt: -1 }).lean();

        if (!activeSub) {
            return NextResponse.json({
                authenticated: true,
                plan: PLANS.FREE,
                details: PLAN_DETAILS[PLANS.FREE],
                subscription: null,
            });
        }

        const isExpired = new Date(activeSub.currentPeriodEnd) < new Date();
        const currentPlan = isExpired ? PLANS.FREE : (activeSub.plan || PLANS.FREE);

        return NextResponse.json({
            authenticated: true,
            plan: currentPlan,
            details: PLAN_DETAILS[currentPlan] || PLAN_DETAILS[PLANS.FREE],
            subscription: {
                id: activeSub._id.toString(),
                plan: activeSub.plan,
                billingCycle: activeSub.billingCycle,
                amount: activeSub.amount,
                currency: activeSub.currency,
                status: isExpired ? "expired" : activeSub.status,
                currentPeriodStart: activeSub.currentPeriodStart,
                currentPeriodEnd: activeSub.currentPeriodEnd,
                razorpayPaymentId: activeSub.razorpayPaymentId,
                isExpired,
            },
        });
    } catch (e) {
        console.error("subscription-status API error:", e);
        return NextResponse.json(
            { error: e.message || "Failed to fetch status" },
            { status: 500 }
        );
    }
}
