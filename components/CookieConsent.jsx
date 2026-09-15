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
            <div className="relative overflow-hidden rounded-2xl bg-[#161c28]/95 backdrop-blur-md border border-[#2b3548] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white animate-in fade-in slide-in-from-bottom-5">
                {/* Glowing subtle amber line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#F2C94C] via-[#F2994A] to-transparent" />

                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#F2C94C]/15 border border-[#F2C94C]/30 text-[#F2C94C] shrink-0">
                            <Cookie className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-semibold text-white tracking-tight">
                                We value your privacy & experience
                            </h4>
                            <p className="text-xs text-slate-400">
                                Cookie & Local Storage Consent
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
                        title="Dismiss (will remind you in 30s)"
                        aria-label="Close cookie consent notice"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-3.5">
                    Bookified uses cookies and local storage to remember your reading progress, customize your AI voice interactions, and analyze reader engagement. Read our{' '}
                    <Link href="/privacy" className="text-[#F2C94C] underline-offset-2 hover:underline font-medium">
                        Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/terms" className="text-[#F2C94C] underline-offset-2 hover:underline font-medium">
                        Terms of Service
                    </Link>
                    .
                </p>

                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2C94C] to-[#F2994A] text-[#0F172A] text-sm font-semibold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-[#F2C94C]/15 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        Accept All
                    </button>
                </div>
            </div>
        </aside>
    );
}
