import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Razorpay from "razorpay";
import { PLAN_DETAILS, PLANS } from "@/lib/subscription-constants";

export async function POST(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Please sign in to choose a subscription plan." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { planId, billingCycle = "monthly" } = body;

        if (!planId || (planId !== PLANS.STANDARD && planId !== PLANS.PRO)) {
            return NextResponse.json(
                { success: false, error: "Invalid subscription plan selected." },
                { status: 400 }
            );
        }

        const planConfig = PLAN_DETAILS[planId];
        const amount = billingCycle === "yearly" ? planConfig.priceYearly : planConfig.priceMonthly;
        const amountInPaise = Math.round(amount * 100);

        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        // If Razorpay keys are configured in environment
        if (keyId && keySecret && !keyId.includes("...") && !keySecret.includes("...")) {
            try {
                const razorpay = new Razorpay({
                    key_id: keyId,
                    key_secret: keySecret,
                });

                const receipt = `rcpt_${userId.replace(/[^a-zA-Z0-9]/g, "").slice(-8)}_${Date.now().toString().slice(-6)}`;

                const order = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt,
                    notes: {
                        clerkId: userId,
                        plan: planId,
                        billingCycle,
                    },
                });

                return NextResponse.json({
                    success: true,
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
                    plan: planId,
                    planName: planConfig.name,
                    billingCycle,
                    isDemo: false,
                });
            } catch (rzpErr) {
                console.error("Razorpay order creation error:", rzpErr);
                return NextResponse.json(
                    { success: false, error: rzpErr.error?.description || rzpErr.message || "Failed to create Razorpay order." },
                    { status: 500 }
                );
            }
        }

        // Sandbox / Test fallback mode if API keys are not yet configured in .env.local
        const demoOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return NextResponse.json({
            success: true,
            orderId: demoOrderId,
            amount: amountInPaise,
            currency: "INR",
            keyId: "rzp_test_placeholder",
            plan: planId,
            planName: planConfig.name,
            billingCycle,
            isDemo: true,
            demoNotice: "Razorpay keys not yet added to .env.local. Running in interactive test simulation mode.",
        });
    } catch (e) {
        console.error("Error creating order:", e);
        return NextResponse.json(
            { success: false, error: e.message || "Internal server error" },
            { status: 500 }
        );
    }
}
