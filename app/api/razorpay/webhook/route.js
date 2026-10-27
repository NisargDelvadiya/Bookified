import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/database/mongoose";
import Subscription from "@/database/models/subscription.model";
import { clerkClient } from "@clerk/nextjs/server";
import { calculatePeriodEnd } from "@/lib/subscription-constants";

export async function POST(req) {
    try {
        const bodyText = await req.text();
        const signature = req.headers.get("x-razorpay-signature");
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature if secret is configured
        if (webhookSecret && !webhookSecret.includes("...")) {
            if (!signature) {
                return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
            }

            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(bodyText)
                .digest("hex");

            if (expectedSignature !== signature) {
                console.error("Razorpay webhook signature mismatch");
                return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
            }
        }

        const eventData = JSON.parse(bodyText);
        const event = eventData.event;

        if (event === "payment.captured" || event === "order.paid") {
            const paymentEntity = eventData.payload?.payment?.entity;
            const notes = paymentEntity?.notes || {};
            const clerkId = notes.clerkId;
            const plan = notes.plan;
            const billingCycle = notes.billingCycle || "monthly";

            if (clerkId && plan) {
                await connectToDatabase();
                const startDate = new Date();
                const endDate = calculatePeriodEnd(billingCycle, startDate);

                await Subscription.findOneAndUpdate(
                    { clerkId },
                    {
                        clerkId,
                        userEmail: paymentEntity.email || "",
                        plan,
                        billingCycle,
                        amount: paymentEntity.amount / 100,
                        currency: paymentEntity.currency || "INR",
                        status: "active",
                        razorpayOrderId: paymentEntity.order_id,
                        razorpayPaymentId: paymentEntity.id,
                        currentPeriodStart: startDate,
                        currentPeriodEnd: endDate,
                    },
                    { upsert: true }
                );

                try {
                    const client = await clerkClient();
                    await client.users.updateUserMetadata(clerkId, {
                        publicMetadata: {
                            plan,
                            billingCycle,
                            subscriptionStatus: "active",
                            currentPeriodEnd: endDate.toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    });
                } catch (clerkErr) {
                    console.warn("Webhook Clerk metadata update error:", clerkErr);
                }
            }
        }

        return NextResponse.json({ status: "ok", received: true });
    } catch (e) {
        console.error("Razorpay webhook error:", e);
        return NextResponse.json({ error: e.message || "Webhook processing error" }, { status: 500 });
    }
}
