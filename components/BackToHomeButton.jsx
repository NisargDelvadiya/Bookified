'use client';

import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';

export default function BackToHomeButton({ className = '' }) {
    const handleBackToHome = (e) => {
        e.preventDefault();

        // 1. If opener tab is available and open, bring it to home and focus it
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.location.href = 'https://bookified-now.vercel.app';
                window.opener.focus();
            }
        } catch (err) {
            console.warn('Opener navigation notice:', err);
        }

        // 2. Attempt to close this tab
        window.close();

        // 3. Fallback: If browser security prevents window.close(), navigate this tab to home
        setTimeout(() => {
            window.location.href = 'https://bookified-now.vercel.app';
        }, 150);
    };

    return (
        <button
            type="button"
            onClick={handleBackToHome}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#663820]/10 hover:bg-[#663820]/20 text-[#663820] font-semibold text-sm transition-all shadow-xs cursor-pointer ${className}`}
            title="Close this tab and return to Home"
        >
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
        </button>
    );
}
