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
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 text-sm font-medium text-[#212a3b] dark:text-gray-200 hover:bg-white transition-all shadow-xs"
                aria-expanded={isOpen}
            >
                <Globe className="w-4 h-4 text-[#212a3b] dark:text-gray-300" />
                <span>{activeLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-56 max-h-72 overflow-y-auto rounded-2xl bg-[#1e232d] text-white shadow-2xl ring-1 ring-black/5 z-50 p-1.5 focus:outline-none scrollbar-thin">
                    {INDIAN_LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl text-left transition-colors ${
                                    isSelected
                                        ? 'bg-white/10 text-white font-semibold'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {isSelected ? <Check className="w-4 h-4 text-white" /> : <span className="w-4" />}
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
