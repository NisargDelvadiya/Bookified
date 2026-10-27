import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import crypto from "crypto";
import { connectToDatabase } from "@/database/mongoose";
import Subscription from "@/database/models/subscription.model";
import { PLAN_DETAILS, PLANS, calculatePeriodEnd } from "@/lib/subscription-constants";

export async function POST(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Please sign in to verify payment." },
                { status: 401 }
            );
        }

        const user = await currentUser();
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
            billingCycle = "monthly",
            isDemo = false,
        } = body;

        if (!planId || (planId !== PLANS.STANDARD && planId !== PLANS.PRO)) {
            return NextResponse.json(
                { success: false, error: "Invalid subscription plan." },
                { status: 400 }
            );
        }

        const planConfig = PLAN_DETAILS[planId];
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        // Verify Razorpay HMAC signature if not in demo mode
        if (!isDemo && keySecret && !keySecret.includes("...")) {
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return NextResponse.json(
                    { success: false, error: "Missing required Razorpay payment verification details." },
                    { status: 400 }
                );
            }

            const expectedSignature = crypto
                .createHmac("sha256", keySecret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                console.error("Signature mismatch: expected", expectedSignature, "got", razorpay_signature);
                return NextResponse.json(
                    { success: false, error: "Payment verification failed. Invalid signature." },
                    { status: 400 }
                );
            }
        }

        const amount = billingCycle === "yearly" ? planConfig.priceYearly : planConfig.priceMonthly;
        const currentPeriodStart = new Date();
        const currentPeriodEnd = calculatePeriodEnd(billingCycle, currentPeriodStart);

        // 1. Connect to MongoDB and save / update subscription
        await connectToDatabase();
        const subscription = await Subscription.findOneAndUpdate(
            { clerkId: userId },
            {
                clerkId: userId,
                userEmail: user?.primaryEmailAddress?.emailAddress || "",
                userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username || "Bookified Member",
                plan: planId,
                billingCycle,
                amount,
                currency: "INR",
                status: "active",
                razorpayOrderId: razorpay_order_id || `order_${Date.now()}`,
                razorpayPaymentId: razorpay_payment_id || `pay_${Date.now()}`,
                razorpaySignature: razorpay_signature || "verified",
                currentPeriodStart,
                currentPeriodEnd,
                isDemo: Boolean(isDemo),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 2. Sync to Clerk user publicMetadata
        try {
            const client = await clerkClient();
            await client.users.updateUserMetadata(userId, {
                publicMetadata: {
                    plan: planId,
                    billingCycle,
                    subscriptionStatus: "active",
                    currentPeriodEnd: currentPeriodEnd.toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            });
        } catch (clerkErr) {
            console.warn("Could not update Clerk metadata:", clerkErr);
        }

        return NextResponse.json({
            success: true,
            message: `Congratulations! You have been upgraded to the ${planConfig.name} plan.`,
            plan: planId,
            planName: planConfig.name,
            currentPeriodEnd,
            subscription: {
                id: subscription._id.toString(),
                plan: subscription.plan,
                billingCycle: subscription.billingCycle,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd,
                razorpayPaymentId: subscription.razorpayPaymentId,
            },
        });
    } catch (e) {
        console.error("Payment verification error:", e);
        return NextResponse.json(
            { success: false, error: e.message || "Failed to process payment." },
            { status: 500 }
        );
    }
}
