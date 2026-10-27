import { model, Schema, models } from "mongoose";

const SubscriptionSchema = new Schema(
    {
        clerkId: { type: String, required: true, index: true },
        userEmail: { type: String },
        userName: { type: String },
        plan: {
            type: String,
            enum: ["free", "standard", "pro"],
            default: "free",
            required: true,
        },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly",
        },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
        status: {
            type: String,
            enum: ["active", "cancelled", "expired", "created"],
            default: "active",
        },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        currentPeriodStart: { type: Date, default: Date.now },
        currentPeriodEnd: { type: Date, required: true },
        isDemo: { type: Boolean, default: false },
    },
    { timestamps: true }
);

SubscriptionSchema.index({ clerkId: 1, status: 1 });

const Subscription = models.Subscription || model("Subscription", SubscriptionSchema);

export default Subscription;
