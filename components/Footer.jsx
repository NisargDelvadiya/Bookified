'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GoogleTranslate from './GoogleTranslate';
import ZohoFeedbackModal from './ZohoFeedbackModal';
import { Heart, ExternalLink } from 'lucide-react';

const donationCauses = [
    {
        name: 'The Akshaya Patra Foundation',
        subtitle: 'Mid-Day Meal Programme',
        url: 'https://www.akshayapatra.org/donate-to-midday-meal-programme?utm_source=google&utm_medium=cpc&utm_campaign=gads&utm_content=lapsed-px-mdm-26&gad_source=1&gad_campaignid=23942140523&gbraid=0AAAAADtGwlyegnOx-VzkL8UHqs8vuzz7g&gclid=Cj0KCQjwteTUBhD4ARIsAEYjs3rUSyHEw9nWu5CbfvFXoTIkZdv4Ke30P2gYdi4b5n-ryB1I4cZs5BAaAukFEALw_wcB',
    },
    {
        name: 'Hindu Fund',
        subtitle: 'Preserving Heritage & Dharma',
        url: 'https://hindu.fund/',
    },
    {
        name: 'Veducation',
        subtitle: 'Vedic Knowledge for Next Gen',
        url: 'https://www.veducation.world/',
    },
    {
        name: 'Shiv Dhaam',
        subtitle: 'Spiritual Sanctuaries & Service',
        url: 'https://www.shivdhaam.org.in/?gad_source=1&gad_campaignid=23949023171&gbraid=0AAAAA-wKSMMO4ZiZthKTvahdFl4GIwcLA&gclid=CjwKCAjwqJXUBhBNEiwA8BgG7ieXXDG3WGkjFA0uEGe8yEg6NRAmmD_r6jHUKL3IaqTBgIR3aL-AjBoCq5wQAvD_BwE',
    },
    {
        name: 'For The People',
        subtitle: 'Grassroots Community Upliftment',
        url: 'https://forthepeople.in/en',
    },
];

const Footer = () => {
    return (
        <footer
            role="contentinfo"
            aria-label="Site Footer"
            className="w-full bg-[#1b222f] text-gray-300 mt-20 border-t border-gray-800"
        >
            <div className="wrapper py-14">
                <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-12">
                    {/* 1. Brand & Mission */}
                    <div className="space-y-4 max-w-sm">
                        <Link href="https://bookified-now.vercel.app" className="flex gap-2.5 items-center" aria-label="Bookified Home">
                            <Image
                                src="/assets/logo-white-hd.png"
                                alt="Bookified Logo"
                                width={46}
                                height={29}
                                className="object-contain"
                            />
                            <span className="font-serif font-bold text-3xl text-white tracking-wide">Bookified</span>
                        </Link>
                        <p className="text-[15px] sm:text-base text-gray-300/90 leading-relaxed">
                            Empowering knowledge seekers through AI-powered conversational reading. Turn your books into live, interactive voice sessions.
                        </p>
                    </div>

                    {/* 2. Legal & Indian Compliance */}
                    <div className="space-y-4 shrink-0">
                        <h4 className="text-base font-semibold text-white tracking-wider uppercase text-xs">
                            Legal & Compliance
                        </h4>
                        <ul className="space-y-2.5 text-sm flex flex-col">
                            <li>
                                <Link
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-1.5 hover:text-white hover:underline underline-offset-4 transition-colors"
                                >
                                    <span>Terms & Conditions</span>
                                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-1.5 hover:text-white hover:underline underline-offset-4 transition-colors"
                                >
                                    <span>Privacy Policy (DPDP 2023)</span>
                                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* 3. Supported Causes & Donations */}
                    <div className="space-y-4 shrink-0">
                        <h4 className="text-base font-semibold text-white tracking-wider uppercase text-xs">
                            Supported Causes & Donations
                        </h4>
                        <ul className="space-y-2.5 flex flex-col">
                            {donationCauses.map((cause) => (
                                <li key={cause.name}>
                                    <a
                                        href={cause.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group inline-flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
                                    >
                                        <span className="group-hover:underline underline-offset-4">{cause.name}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Copyright Bar with Feedback & Translation Buttons in Single Line */}
                <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                    <p className="text-center sm:text-left order-2 sm:order-1">
                        © 2026 • Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline mx-0.5" /> in Bharat 🇮🇳 |{' '}
                        <Link
                            href="https://bookified-now.vercel.app"
                            className="hover:text-white hover:underline underline-offset-2 transition-colors font-normal text-gray-300"
                        >
                            Bookified™
                        </Link>{' '}
                        • All Rights Reserved
                    </p>

                    <div className="flex items-center gap-3 order-1 sm:order-2 shrink-0">
                        <ZohoFeedbackModal buttonOnly={true} />
                        <GoogleTranslate />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
