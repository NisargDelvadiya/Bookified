'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GoogleTranslate from './GoogleTranslate';
import { Heart, ExternalLink, ShieldCheck, Mail, MapPin, User } from 'lucide-react';

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
        <footer className="w-full bg-[#1b222f] text-gray-300 mt-20 border-t border-gray-800">
            <div className="wrapper py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* 1. Brand & Mission */}
                    <div className="space-y-4">
                        <Link href="https://bookified-now.vercel.app" className="flex gap-2 items-center">
                            <Image src="/assets/logo.png" alt="Bookified Logo" width={38} height={24} className="brightness-110" />
                            <span className="font-serif font-bold text-2xl text-white tracking-wide">Bookified</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Empowering knowledge seekers through AI-powered conversational reading. Turn your books into live, interactive voice sessions.
                        </p>
                        <div className="pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300">
                                Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> in Bharat 🇮🇳
                            </span>
                        </div>
                    </div>

                    {/* 2. Supported Causes & Donations */}
                    <div className="space-y-4">
                        <h4 className="text-base font-semibold text-white tracking-wider uppercase text-xs">
                            Supported Causes & Donations
                        </h4>
                        <p className="text-xs text-gray-400">
                            Support verified Indian charitable and educational initiatives:
                        </p>
                        <ul className="space-y-2.5">
                            {donationCauses.map((cause) => (
                                <li key={cause.name}>
                                    <a
                                        href={cause.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between text-sm text-gray-300 hover:text-white transition-colors"
                                    >
                                        <span className="group-hover:underline underline-offset-4">{cause.name}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 3. Legal & Indian Compliance */}
                    <div className="space-y-4">
                        <h4 className="text-base font-semibold text-white tracking-wider uppercase text-xs">
                            Legal & Compliance
                        </h4>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link href="/terms" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                                    Privacy Policy (DPDP 2023)
                                </Link>
                            </li>
                            <li>
                                <Link href="/subscriptions" className="hover:text-white hover:underline underline-offset-4 transition-colors">
                                    Pricing & Plans
                                </Link>
                            </li>
                        </ul>

                        {/* Grievance Officer Card */}
                        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5 mt-3">
                            <div className="flex items-center gap-1.5 font-semibold text-gray-200">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>Grievance Officer (IT Rules, 2021)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <User className="w-3 h-3 text-gray-400" />
                                <span>Nisarg Jayesh Delvadiya</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <a href="mailto:nisarg.delvadiya1@zohomail.in" className="hover:text-white underline">
                                    nisarg.delvadiya1@zohomail.in
                                </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>Vadodara, Gujarat, Bharat</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Language Selector & Quick Nav */}
                    <div className="space-y-4">
                        <h4 className="text-base font-semibold text-white tracking-wider uppercase text-xs">
                            Select Language
                        </h4>
                        <p className="text-xs text-gray-400">
                            Translate Bookified into official Indian regional languages:
                        </p>
                        <GoogleTranslate />

                        <div className="pt-4 border-t border-white/10 text-xs text-gray-400 space-y-1">
                            <p className="font-medium text-gray-300">Fast Navigation</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Link href="/" className="hover:text-white">Library</Link>
                                <span>•</span>
                                <Link href="/books/new" className="hover:text-white">Upload</Link>
                                <span>•</span>
                                <Link href="/subscriptions" className="hover:text-white">Pricing</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright Bar */}
                <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 text-center sm:text-left">
                    <p>
                        © 2026 • Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline mx-0.5" /> in Bharat 🇮🇳 | <span className="font-semibold text-gray-200">Bookified™</span> • All Rights Reserved
                    </p>
                    <p className="text-gray-500 text-[11px]">
                        Compliant with Information Technology Act, 2000 & DPDP Act, 2023
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
