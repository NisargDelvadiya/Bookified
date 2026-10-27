import React from "react";
import RazorpayPricingCards from "@/components/RazorpayPricingCards";

export const metadata = {
    title: "Pricing & Plans | Bookified — Razorpay Payments",
    description: "Choose your Bookified subscription plan. Instant, secure activation with Razorpay supporting UPI (GPay, PhonePe, Paytm), RuPay, Cards, and Netbanking.",
    keywords: [
        "Bookified Pricing",
        "Bookified Subscription",
        "Razorpay Payments",
        "AI Book Voice",
        "UPI Subscription",
        "Student Plan",
        "Pro Bibliophile",
    ],
};

export default function SubscriptionsPage() {
    return (
        <main className="wrapper container py-10 md:py-16">
            <RazorpayPricingCards />
        </main>
    );
}
