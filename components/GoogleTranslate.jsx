'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';

export const INDIAN_LANGUAGES = [
    { label: 'English', code: 'en' },
    { label: 'Assamese', code: 'as' },
    { label: 'Bengali', code: 'bn' },
    { label: 'Dogri', code: 'doi' },
    { label: 'Gujarati', code: 'gu' },
    { label: 'Hindi', code: 'hi' },
    { label: 'Kannada', code: 'kn' },
    { label: 'Kashmiri', code: 'ks' },
    { label: 'Konkani', code: 'gom' },
    { label: 'Maithili', code: 'mai' },
    { label: 'Malayalam', code: 'ml' },
    { label: 'Manipuri (Meiteilon)', code: 'mni-Mtei' },
    { label: 'Marathi', code: 'mr' },
    { label: 'Nepali', code: 'ne' },
    { label: 'Odia', code: 'or' },
    { label: 'Punjabi', code: 'pa' },
    { label: 'Sanskrit', code: 'sa' },
    { label: 'Santali', code: 'sat' },
    { label: 'Tamil', code: 'ta' },
    { label: 'Telugu', code: 'te' },
];

const GoogleTranslate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Read current language cookie if set
        const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
        if (match && match[1]) {
            setSelectedLanguage(match[1]);
        }

        // Initialize Google Translate script
        window.googleTranslateElementInit = () => {
            if (window.google && window.google.translate) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: INDIAN_LANGUAGES.map((l) => l.code).join(','),
                        autoDisplay: false,
                    },
                    'google_translate_element'
                );
            }
        };

        if (!document.getElementById('google-translate-script')) {
            const script = document.createElement('script');
            script.id = 'google-translate-script';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Suppress Google Translate banner frame and body top offset
        const observer = new MutationObserver(() => {
            const banners = document.querySelectorAll('.goog-te-banner-frame, .VIpgJd-ZVi9od-ORHb-OEVmcd, iframe.skiptranslate');
            banners.forEach((b) => {
                b.style.setProperty('display', 'none', 'important');
                b.style.setProperty('visibility', 'hidden', 'important');
                b.style.setProperty('height', '0px', 'important');
            });
            if (document.body.style.top && document.body.style.top !== '0px') {
                document.body.style.setProperty('top', '0px', 'important');
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
        });

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            observer.disconnect();
        };
    }, []);

    const changeLanguage = (code) => {
        setSelectedLanguage(code);
        setIsOpen(false);

        // Set Google Translate cookie
        document.cookie = `googtrans=/en/${code}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=/en/${code}; path=/;`;

        // Update the select element inside Google Translate widget if available
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = code;
            select.dispatchEvent(new Event('change'));
        } else {
            window.location.reload();
        }
    };

    const activeLabel = INDIAN_LANGUAGES.find((l) => l.code === selectedLanguage)?.label || 'English';

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Hidden native container */}
            <div id="google_translate_element" className="hidden" />

            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`Select website language. Current language: ${activeLabel}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 text-sm font-medium text-[#212a3b] dark:text-gray-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#212a3b] focus-visible:outline-none transition-all shadow-xs"
            >
                <Globe className="w-4 h-4 text-[#212a3b] dark:text-gray-300" aria-hidden="true" />
                <span>{activeLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label="Available languages"
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 max-h-72 overflow-y-auto rounded-2xl bg-[#1e232d] text-white shadow-2xl ring-1 ring-black/5 z-50 p-1.5 focus:outline-none scrollbar-thin"
                >
                    {INDIAN_LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                            <button
                                key={lang.code}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-left transition-colors focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none ${
                                    isSelected
                                        ? 'bg-white/10 text-white font-semibold'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {isSelected ? <Check className="w-4 h-4 text-white" aria-hidden="true" /> : <span className="w-4" />}
                                    {lang.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GoogleTranslate;
