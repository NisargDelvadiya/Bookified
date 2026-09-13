'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { PricingTable } from '@clerk/nextjs';
import { Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ClerkPricingErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Clerk PricingTable notice:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function SubscriptionsPage() {
  return (
    <div className="wrapper container py-12 md:py-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#663820]/10 text-[#663820] text-sm font-semibold mb-4">
          <Sparkles className="size-4" />
          <span>Powered by Clerk Billing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#212a3b] mb-4">
          Choose Your Plan
        </h1>
        <p className="text-[#555] max-w-2xl text-base sm:text-lg leading-relaxed">
          Upgrade your account through Clerk to unlock more book uploads, extended voice session times, and premium AI personas.
        </p>
      </div>

      {/* Clerk Official Pricing Table with Safe Fallback */}
      <div className="clerk-pricing-container max-w-5xl mx-auto">
        <ClerkPricingErrorBoundary
          fallback={
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-200 shadow-soft-md max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-full bg-[#663820]/10 text-[#663820] flex items-center justify-center mx-auto mb-5">
                <ShieldCheck className="size-7" />
              </div>
              <h2 className="text-2xl font-bold font-serif text-[#212a3b] mb-3">
                Enable Clerk Billing in Dashboard
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                To show Clerk&apos;s native pricing table here, make sure your subscription plans (Standard & Pro) are created in your Clerk Dashboard under <b>Billing / Subscription Plans</b>.
              </p>

              <a
                href="https://dashboard.clerk.com/last-active?path=billing"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#212a3b] hover:bg-[#3d485e] text-white font-semibold text-sm transition-all shadow-md"
              >
                <span>Open Clerk Billing Settings</span>
                <ExternalLink className="size-4" />
              </a>
            </div>
          }
        >
          <PricingTable />
        </ClerkPricingErrorBoundary>
      </div>
    </div>
  );
}
