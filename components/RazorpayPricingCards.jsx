'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import {
    Check,
    X,
    Sparkles,
    ShieldCheck,
    Zap,
    CreditCard,
    ArrowRight,
    Loader2,
        Crown,
    HelpCircle,
    ChevronDown,
    Lock,
    RefreshCw,
    BadgeCheck,
} from "lucide-react";
import { PLANS, PLAN_DETAILS } from "@/lib/subscription-constants";
import { useSubscription } from "@/hooks/useSubscription";

// Dynamically load Razorpay checkout script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (typeof window === "undefined") return resolve(false);
        if (window.Razorpay) return resolve(true);

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const FAQS = [
    {
        q: "Which payment methods are supported via Razorpay?",
        a: "We support all major Indian and international payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay, Amex), Netbanking across 50+ Indian banks, and digital wallets.",
    },
    {
        q: "How does the voice conversation limit work?",
        a: "Voice session minutes refresh every billing cycle. On the Free plan, you can talk for up to 15 minutes per session. Standard gives you 30-minute sessions (150 sessions/month), while Pro gives you up to 60-minute in-depth sessions with unlimited calls.",
    },
    {
        q: "Can I upgrade or switch plans at any time?",
        a: "Yes! You can upgrade from Free to Standard or Pro at any time. When you upgrade, your new limits and premium features are activated immediately.",
    },
    {
        q: "What happens if I reach my book upload limit?",
        a: "Once you reach your book upload quota (3 on Free, 25 on Standard, 500 on Pro), simply upgrade to the next tier or remove older books from your library to make room for new ones.",
    },
    {
        q: "Is my payment information safe and DPDP compliant?",
        a: "Absolutely. All transactions are securely processed through Razorpay with 256-bit bank-grade TLS encryption. Bookified never stores your card numbers or UPI PINs, fully complying with India's Digital Personal Data Protection (DPDP) Act, 2023.",
    },
];

export default function RazorpayPricingCards() {
    const { user, isLoaded: isUserLoaded } = useUser();
    const { openSignIn } = useClerk();
    const router = useRouter();
    const { plan: currentPlan } = useSubscription();

    const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [activeSubscriptionData, setActiveSubscriptionData] = useState(null);
    
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [demoModal, setDemoModal] = useState(null);
    const [successModal, setSuccessModal] = useState(null);

    // Fetch user detailed subscription status from server
    useEffect(() => {
        let isMounted = true;
        async function fetchStatus() {
            try {
                const res = await fetch("/api/razorpay/subscription-status");
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted) {
                        setActiveSubscriptionData(data.subscription);
                    }
                }
            } catch (err) {
                console.warn("Could not fetch subscription status:", err);
            } finally {
                
            }
        }

        if (isUserLoaded) {
            fetchStatus();
        }
        return () => {
            isMounted = false;
        };
    }, [isUserLoaded, currentPlan]);

    // Handle Plan Selection & Razorpay Checkout
    const handleSelectPlan = async (planId) => {
        if (planId === PLANS.FREE) {
            toast.info("You already have access to the Free Starter plan!");
            return;
        }

        if (!user) {
            toast("Please sign in first", {
                description: "Create an account or sign in with Clerk to subscribe.",
            });
            openSignIn();
            return;
        }

        if (currentPlan === planId && !activeSubscriptionData?.isExpired) {
            toast.success(`You are currently subscribed to the ${PLAN_DETAILS[planId].name} plan.`);
            return;
        }

        setLoadingPlan(planId);

        try {
            // 1. Create Razorpay Order on server
            const orderRes = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, billingCycle }),
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok || !orderData.success) {
                throw new Error(orderData.error || "Failed to create order");
            }

            // 2. If in Demo Mode (keys not yet configured in .env.local)
            if (orderData.isDemo) {
                setLoadingPlan(null);
                setDemoModal({
                    orderId: orderData.orderId,
                    amount: orderData.amount / 100,
                    planId,
                    planName: orderData.planName,
                    billingCycle,
                });
                return;
            }

            // 3. Live/Test Razorpay Checkout
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "Bookified",
                description: `${orderData.planName} Plan (${billingCycle === "yearly" ? "Annual" : "Monthly"})`,
                image: "/assets/logo-hd.png",
                order_id: orderData.orderId,
                prefill: {
                    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username,
                    email: user.primaryEmailAddress?.emailAddress || "",
                    contact: user.phoneNumbers?.[0]?.phoneNumber || "",
                },
                theme: {
                    color: planId === PLANS.PRO ? "#212a3b" : "#663820",
                },
                handler: async function (response) {
                    await handlePaymentVerification({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        planId,
                        billingCycle,
                        isDemo: false,
                    });
                },
                modal: {
                    ondismiss: function () {
                        setLoadingPlan(null);
                        toast.info("Payment cancelled.");
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (resp) {
                console.error("Razorpay payment failed:", resp.error);
                toast.error(resp.error?.description || "Payment failed. Please try again.");
                setLoadingPlan(null);
            });
            rzp.open();
        } catch (err) {
            console.error("Checkout error:", err);
            toast.error(err.message || "Something went error during checkout.");
            setLoadingPlan(null);
        }
    };

    // Verify Payment & Upgrade Subscription
    const handlePaymentVerification = async (payload) => {
        setLoadingPlan(payload.planId);
        try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || "Payment verification failed");
            }

            // Reload Clerk user session so publicMetadata updates immediately
            if (user?.reload) {
                await user.reload();
            }

            // Refresh status state
            setActiveSubscriptionData(verifyData.subscription);

            // Close demo modal if open
            setDemoModal(null);

            // Show success celebration modal
            setSuccessModal({
                planName: verifyData.planName,
                paymentId: payload.razorpay_payment_id || "DEMO_PAY_" + Date.now().toString().slice(-6),
                billingCycle: payload.billingCycle,
                renewalDate: verifyData.currentPeriodEnd,
            });

            toast.success(verifyData.message || "Payment successful! Plan upgraded.");
        } catch (err) {
            console.error("Verification error:", err);
            toast.error(err.message || "Could not complete payment verification.");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="w-full">
            {/* Top Switcher & Tagline */}
            <div className="flex flex-col items-center justify-center mb-12 sm:mb-16">
                {/* Trust Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#212a3b]/5 border border-[#212a3b]/10 text-[#212a3b] text-sm font-semibold mb-6 shadow-soft-sm">
                    <Zap className="size-4 text-[#663820] fill-[#663820]" />
                    <span>Instant UPI & Card Checkout powered by <b>Razorpay</b></span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#212a3b] text-center tracking-tight mb-4">
                    Transform How You Read Books
                </h1>
                <p className="text-gray-600 max-w-2xl text-center text-base sm:text-lg leading-relaxed mb-8">
                    Choose a plan tailored to your reading goals. Get unlimited voice discussions, ultra-realistic voice models, and instant chapter segmentation.
                </p>

                {/* Billing Toggle (Monthly / Yearly) */}
                <div className="inline-flex items-center bg-gray-100/90 p-1.5 rounded-full border border-gray-200/80 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                            billingCycle === "monthly"
                                ? "bg-white text-[#212a3b] shadow-soft-md"
                                : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        Monthly Billing
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                            billingCycle === "yearly"
                                ? "bg-[#212a3b] text-white shadow-soft-md"
                                : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        <span>Annual Billing</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#663820] text-white tracking-wide">
                            SAVE 25%
                        </span>
                    </button>
                </div>
            </div>

            {/* Active Subscription Banner (if user has active paid plan) */}
            {activeSubscriptionData && activeSubscriptionData.plan !== PLANS.FREE && !activeSubscriptionData.isExpired && (
                <div className="max-w-4xl mx-auto mb-12 p-6 rounded-2xl bg-gradient-to-r from-[#212a3b]/5 via-[#663820]/5 to-transparent border border-[#212a3b]/15 shadow-soft-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#212a3b] text-white flex items-center justify-center shrink-0 shadow-md">
                            <Crown className="size-6 text-amber-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-[#212a3b]">
                                    Current Plan: {PLAN_DETAILS[activeSubscriptionData.plan]?.name}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Active
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Billed {activeSubscriptionData.billingCycle} (₹{activeSubscriptionData.amount}) • Valid until{" "}
                                <span className="font-semibold text-gray-800">
                                    {new Date(activeSubscriptionData.currentPeriodEnd).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                        <ShieldCheck className="size-4 text-emerald-600" />
                        <span>Razorpay ID: {activeSubscriptionData.razorpayPaymentId?.slice(-12) || "Verified"}</span>
                    </div>
                </div>
            )}

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch mb-20">
                {Object.values(PLAN_DETAILS).map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    const isPopular = plan.isPopular;
                    const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
                    const displayMonthlyRate = billingCycle === "yearly" && plan.monthlyEquivalentYearly ? plan.monthlyEquivalentYearly : plan.priceMonthly;
                    const isLoading = loadingPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                                isPopular
                                    ? "bg-white border-2 border-[#212a3b] shadow-soft-xl scale-100 md:-translate-y-2 z-10"
                                    : "bg-white/80 backdrop-blur-sm border border-gray-200 shadow-soft-md hover:shadow-soft-lg hover:border-gray-300"
                            }`}
                        >
                            {/* Popular / Best Value Badge */}
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#212a3b] text-white text-xs font-bold tracking-wide uppercase shadow-md">
                                        <Sparkles className="size-3.5 text-amber-300 fill-amber-300" />
                                        <span>Most Popular</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-serif font-bold text-[#212a3b]">
                                            {plan.name}
                                        </h3>
                                        {isCurrent && (
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
                                                Your Plan
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-500 text-sm leading-snug min-h-[40px]">
                                        {plan.tagline}
                                    </p>
                                </div>

                                {/* Price Box */}
                                <div className="mb-8 pb-6 border-b border-gray-100">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl sm:text-5xl font-serif font-extrabold text-[#212a3b]">
                                            {price === 0 ? "₹0" : `₹${displayMonthlyRate.toLocaleString("en-IN")}`}
                                        </span>
                                        <span className="text-gray-500 font-medium text-sm">
                                            {price === 0 ? "/ forever" : "/ month"}
                                        </span>
                                    </div>
                                    {billingCycle === "yearly" && price > 0 && (
                                        <p className="text-xs text-[#663820] font-semibold mt-2">
                                            ₹{price.toLocaleString("en-IN")} billed annually (save 25%)
                                        </p>
                                    )}
                                </div>

                                {/* Features Checklist */}
                                <div className="space-y-3.5 mb-8">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        What&apos;s Included:
                                    </p>
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            {feat.included ? (
                                                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="size-3.5 stroke-[2.5]" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
                                                    <X className="size-3 stroke-[2]" />
                                                </div>
                                            )}
                                            <span
                                                className={`text-sm leading-tight ${
                                                    feat.included ? "text-gray-700 font-medium" : "text-gray-400 line-through"
                                                }`}
                                            >
                                                {feat.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    disabled={isLoading || (isCurrent && !activeSubscriptionData?.isExpired && plan.id !== PLANS.FREE)}
                                    onClick={() => handleSelectPlan(plan.id)}
                                    className={`w-full py-4 px-6 rounded-2xl font-serif font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-soft-md ${
                                        isCurrent && plan.id === PLANS.FREE
                                            ? "bg-gray-100 text-gray-500 cursor-default shadow-none border border-gray-200"
                                            : isCurrent
                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default"
                                            : isPopular
                                            ? "bg-[#212a3b] hover:bg-[#2d3a52] text-white hover:shadow-soft-lg active:scale-[0.98]"
                                            : plan.id === PLANS.STANDARD
                                            ? "bg-[#663820] hover:bg-[#7a4528] text-white hover:shadow-soft-lg active:scale-[0.98]"
                                            : "bg-gray-100 hover:bg-gray-200 text-[#212a3b] active:scale-[0.98]"
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="size-5 animate-spin" />
                                            <span>Processing Order...</span>
                                        </>
                                    ) : isCurrent ? (
                                        <>
                                            <BadgeCheck className="size-5 text-emerald-600" />
                                            <span>Current Plan</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Upgrade to {plan.name}</span>
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-gray-400">
                                    <Lock className="size-3" />
                                    <span>
                                        {plan.id === PLANS.FREE
                                            ? "No card required"
                                            : "Secured with 256-bit Razorpay encryption"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Trust and Payment Security Banner */}
            <div className="max-w-5xl mx-auto mb-20 p-8 rounded-3xl bg-white border border-gray-200/80 shadow-soft-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#663820]/10 text-[#663820] flex items-center justify-center shrink-0">
                            <Zap className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#212a3b] text-base">Instant Activation</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Your account is upgraded in seconds immediately upon payment.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#212a3b]/10 text-[#212a3b] flex items-center justify-center shrink-0">
                            <CreditCard className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#212a3b] text-base">UPI & Cards</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Pay with GPay, PhonePe, Paytm, RuPay, Visa, Mastercard, or Netbanking.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <ShieldCheck className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#212a3b] text-base">Indian Law Compliant</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Fully aligned with IT Act 2000, SPDI Rules, and DPDP Act 2023.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                            <RefreshCw className="size-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-[#212a3b] text-base">Cancel Anytime</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Seamless, no questions asked policy with full control from your profile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="max-w-3xl mx-auto mb-16">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mb-3">
                        <HelpCircle className="size-3.5" />
                        <span>Got Questions?</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#212a3b]">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-3">
                    {FAQS.map((faq, index) => {
                        const isOpen = openFaqIndex === index;
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-2xl border border-gray-200/90 shadow-soft-sm overflow-hidden transition-all duration-200"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-[#212a3b] hover:text-[#663820] transition-colors"
                                >
                                    <span className="text-base font-serif">{faq.q}</span>
                                    <ChevronDown
                                        className={`size-5 shrink-0 text-gray-400 transition-transform duration-200 ${
                                            isOpen ? "rotate-180 text-[#663820]" : ""
                                        }`}
                                    />
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-5 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                                        <p className="pt-3">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Interactive Demo Sandbox Modal (When keys not yet entered in .env.local) */}
            {demoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-soft-xl border border-gray-200 relative">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-5 mx-auto">
                            <Sparkles className="size-7" />
                        </div>

                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
                                <span>Razorpay Test Sandbox</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-[#212a3b]">
                                Complete Test Checkout
                            </h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                You are testing the <b>{demoModal.planName}</b> plan (₹{demoModal.amount} {demoModal.billingCycle}). Razorpay API keys can be configured in <code className="bg-gray-100 px-1 py-0.5 rounded text-xs text-[#663820]">.env.local</code>.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 mb-6 space-y-2 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Order ID:</span>
                                <span className="font-mono text-gray-800 font-medium">{demoModal.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Amount:</span>
                                <span className="font-bold text-gray-800">₹{demoModal.amount} INR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Gateway:</span>
                                <span className="font-semibold text-[#212a3b]">Razorpay Payments Engine</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() =>
                                    handlePaymentVerification({
                                        razorpay_order_id: demoModal.orderId,
                                        razorpay_payment_id: "pay_sim_" + Date.now(),
                                        razorpay_signature: "simulated_signature",
                                        planId: demoModal.planId,
                                        billingCycle: demoModal.billingCycle,
                                        isDemo: true,
                                    })
                                }
                                className="w-full py-3.5 px-5 rounded-xl bg-[#212a3b] hover:bg-[#2d3a52] text-white font-serif font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Check className="size-4 text-emerald-400" />
                                <span>Simulate Successful Payment (Instant Upgrade)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setDemoModal(null)}
                                className="w-full py-2.5 px-4 rounded-xl text-gray-500 hover:text-gray-800 text-xs font-semibold cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Celebration Modal */}
            {successModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-soft-xl border border-gray-200 text-center relative">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 mx-auto animate-bounce">
                            <Crown className="size-8 text-amber-500" />
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#212a3b] mb-2">
                            Welcome to {successModal.planName}!
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Your payment has been verified via Razorpay and your account limits have been upgraded immediately.
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 mb-6 space-y-2 text-xs text-left text-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Payment ID:</span>
                                <span className="font-mono text-gray-800 font-medium">{successModal.paymentId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Status:</span>
                                <span className="font-bold text-emerald-600">Active & Verified</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Valid Until:</span>
                                <span className="font-semibold text-gray-800">
                                    {new Date(successModal.renewalDate).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setSuccessModal(null);
                                router.push("/");
                            }}
                            className="w-full py-3.5 px-5 rounded-xl bg-[#212a3b] hover:bg-[#2d3a52] text-white font-serif font-bold text-sm transition-all shadow-md cursor-pointer"
                        >
                            Start Exploring Your Library
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
