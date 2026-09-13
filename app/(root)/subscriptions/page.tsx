'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, BookOpen, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS } from '@/lib/subscription-constants';

const plansData = [
  {
    id: PLANS.FREE,
    name: 'Free Reader',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started and exploring interactive book conversations.',
    icon: BookOpen,
    badge: null,
    features: [
      '1 Book in your library',
      '5 Voice sessions per month',
      '5 Minutes per session',
      'Standard conversational AI voices',
      'Real-time live streaming transcript',
    ],
    buttonText: 'Current Plan',
    highlighted: false,
  },
  {
    id: PLANS.STANDARD,
    name: 'Avid Reader',
    price: '$9.99',
    period: '/month',
    description: 'Ideal for frequent readers wanting deeper explorations and more books.',
    icon: Zap,
    badge: 'Most Popular',
    features: [
      'Up to 10 Books in library',
      '100 Voice sessions per month',
      '15 Minutes per session',
      'All ElevenLabs AI Personas',
      'Full voice conversation history',
      'Faster response intelligence',
    ],
    buttonText: 'Upgrade to Standard',
    highlighted: true,
  },
  {
    id: PLANS.PRO,
    name: 'Scholar Pro',
    price: '$19.99',
    period: '/month',
    description: 'Unlimited access for researchers, students, and power learners.',
    icon: Crown,
    badge: 'Best Value',
    features: [
      'Up to 100 Books in library',
      'Unlimited voice sessions',
      '60 Minutes per session',
      'Priority AI compute & low latency',
      'Full voice conversation history',
      'Custom ElevenLabs voice cloning',
      'Export transcripts & notes',
    ],
    buttonText: 'Upgrade to Pro',
    highlighted: false,
  },
];

export default function SubscriptionsPage() {
  const { plan: currentPlan } = useSubscription();

  return (
    <div className="wrapper container py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12 md:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#663820]/10 text-[#663820] text-sm font-semibold mb-4">
          <Sparkles className="size-4" />
          <span>Flexible Plans for Every Reader</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#212a3b] mb-4">
          Choose Your Literary Journey
        </h1>
        <p className="text-[#555] max-w-2xl text-base sm:text-lg leading-relaxed">
          Upgrade your reading companion to unlock larger libraries, extended session times, and high-fidelity ElevenLabs voice synthesis.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
        {plansData.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-white border-2 border-[#663820] shadow-[0_12px_30px_rgba(102,56,32,0.12)] scale-100 md:scale-105 z-10'
                  : 'bg-white/80 backdrop-blur-xs border border-gray-200/80 shadow-soft-sm hover:shadow-soft-md'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#663820] text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                  {plan.badge}
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${plan.highlighted ? 'bg-[#663820]/10 text-[#663820]' : 'bg-gray-100 text-[#212a3b]'}`}>
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-[#212a3b]">{plan.name}</h3>
                </div>

                <p className="text-xs text-[#666] mb-6 min-h-[36px]">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-gray-100">
                  <span className="text-4xl font-extrabold text-[#212a3b]">{plan.price}</span>
                  <span className="text-sm font-medium text-gray-500">{plan.period}</span>
                </div>

                {/* Feature List */}
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#3d485e]">
                      <div className="mt-0.5 rounded-full p-0.5 bg-emerald-100 text-emerald-700">
                        <Check className="size-3.5 stroke-[2.5]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm cursor-default border border-gray-200 text-center"
                  >
                    ✓ Active Plan
                  </button>
                ) : (
                  <Link
                    href="mailto:support@bookified.app?subject=Upgrade%20Plan"
                    className={`w-full block py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all ${
                      plan.highlighted
                        ? 'bg-[#663820] hover:bg-[#522d1a] text-white shadow-md hover:shadow-lg'
                        : 'bg-[#212a3b] hover:bg-[#3d485e] text-white shadow-sm'
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ / Note */}
      <div className="mt-16 text-center text-sm text-gray-500 max-w-xl mx-auto">
        <p>
          Need a custom university or team plan? Contact us anytime to set up custom limits and private voice models.
        </p>
      </div>
    </div>
  );
}
