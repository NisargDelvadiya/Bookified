'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'bookified_cookie_consent';
const DISMISSED_TIME_KEY = 'bookified_cookie_dismissed_at';
const REAPPEAR_INTERVAL_MS = 30000; // 30 seconds

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const timerRef = useRef(null);

    const scheduleReappear = (delayMs = REAPPEAR_INTERVAL_MS) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            try {
                if (localStorage.getItem(CONSENT_STORAGE_KEY) !== 'accepted') {
                    setIsVisible(true);
                }
            } catch (e) {
                setIsVisible(true);
            }
        }, delayMs);
    };

    useEffect(() => {
        setMounted(true);
        try {
            const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (consent === 'accepted') {
                setIsVisible(false);
                return;
            }

            const lastDismissed = sessionStorage.getItem(DISMISSED_TIME_KEY);
            if (lastDismissed) {
                const elapsed = Date.now() - Number(lastDismissed);
                const remaining = REAPPEAR_INTERVAL_MS - elapsed;
                if (remaining > 0) {
                    scheduleReappear(remaining);
                    return;
                }
            }

            // Initial pop-up on first load
            scheduleReappear(1000);
        } catch (e) {
            scheduleReappear(1000);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleAccept = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        try {
            localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
            sessionStorage.removeItem(DISMISSED_TIME_KEY);
        } catch (e) {
            // Ignore storage errors in restricted contexts
        }
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        try {
            sessionStorage.setItem(DISMISSED_TIME_KEY, Date.now().toString());
        } catch (e) {
            // Ignore storage errors
        }
        // Reschedule to pop up again after 30 seconds until user accepts
        scheduleReappear(REAPPEAR_INTERVAL_MS);
    };

    if (!mounted || !isVisible) return null;

    return (
        <aside
            role="region"
            aria-label="Cookie consent banner"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] max-w-lg transition-all duration-300"
        >
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1b222f] border border-[#e8dfcf] dark:border-[#313c4f] p-5 shadow-[0_16px_48px_rgba(33,42,59,0.18)] text-[#212a3b] dark:text-white animate-in fade-in slide-in-from-bottom-5">
                {/* Warm literary gradient accent line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#663820] via-[#8B7355] to-transparent" />

                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#f3e4c7] dark:bg-[#253043] border border-[#e2d0b5] dark:border-gray-700 text-[#663820] dark:text-[#f3e4c7] shrink-0">
                            <Cookie className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-serif font-semibold text-[#212a3b] dark:text-white tracking-tight">
                                We value your privacy & experience
                            </h4>
                            <p className="text-xs text-[#6b7280] dark:text-gray-400">
                                Cookie & Local Storage Consent
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1.5 text-gray-400 hover:text-[#212a3b] dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                        title="Dismiss (will remind you in 30s)"
                        aria-label="Close cookie consent notice"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs sm:text-sm text-[#3d485e] dark:text-gray-300 leading-relaxed mt-3.5">
                    Bookified uses cookies and local storage to remember your reading progress, customize your AI voice interactions, and analyze reader engagement. Read our{' '}
                    <Link href="/privacy" className="text-[#663820] dark:text-[#f3e4c7] underline-offset-2 hover:underline font-semibold">
                        Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/terms" className="text-[#663820] dark:text-[#f3e4c7] underline-offset-2 hover:underline font-semibold">
                        Terms of Service
                    </Link>
                    .
                </p>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#212a3b] hover:bg-[#2d3950] text-white text-sm font-medium transition-all shadow-md shadow-[#212a3b]/15 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                        <ShieldCheck className="w-4 h-4 text-[#f3e4c7]" />
                        <span>Accept All</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
