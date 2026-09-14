'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppLayoutShell({ children }) {
    const pathname = usePathname();
    const isLegalPage = pathname === '/terms' || pathname === '/privacy';

    if (isLegalPage) {
        return (
            <div id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg-primary)] outline-none py-6 sm:py-10">
                {children}
            </div>
        );
    }

    return (
        <>
            <div>
                <Navbar />
                <div id="main-content" tabIndex={-1} className="pt-[var(--navbar-height)] outline-none">
                    {children}
                </div>
            </div>
            <Footer />
        </>
    );
}
