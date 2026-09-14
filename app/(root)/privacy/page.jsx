import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';
import GrievanceOfficerCard from '@/components/GrievanceOfficerCard';

export const metadata = {
    title: 'Privacy Policy | Bookified',
    description: 'Privacy Policy of Bookified complying with the Digital Personal Data Protection Act, 2023 (DPDP Act) and SPDI Rules, 2011 of India.',
};

export default function PrivacyPage() {
    return (
        <main className="wrapper py-12 max-w-4xl mx-auto text-[#212a3b]">
            <div className="mb-8">
                <div className="mb-4">
                    <BackToHomeButton />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-8 h-8 text-[#663820]" />
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#212a3b]">Privacy Policy</h1>
                </div>
                <p className="text-sm text-[#777]">
                    Compliant with the Digital Personal Data Protection (DPDP) Act, 2023 & Information Technology (SPDI) Rules, 2011 • Republic of India (Bharat)
                </p>
            </div>

            <div className="space-y-8 text-base leading-relaxed bg-white p-6 sm:p-10 rounded-2xl border border-gray-200/80 shadow-soft-sm">
                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">1.</span> Overview & Data Fiduciary Details
                    </h2>
                    <p>
                        At <strong>Bookified™</strong>, we respect your privacy and are committed to protecting your personal data in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>.
                    </p>
                    <p>
                        This Privacy Policy explains what personal information we collect, how it is processed, stored, and the rights you hold as a Data Principal.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">2.</span> Information We Collect
                    </h2>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-[#444]">
                        <li>
                            <strong>Account Information:</strong> Name, email address, profile picture, and authentication identifiers provided through our secure authentication partner (Clerk).
                        </li>
                        <li>
                            <strong>User Uploaded Content:</strong> PDF documents, book titles, author details, and auto-generated cover images you choose to upload to your digital library.
                        </li>
                        <li>
                            <strong>Voice Interaction & Session Transcripts:</strong> Audio streaming data and conversation text transcripts generated during voice sessions with the AI assistant.
                        </li>
                        <li>
                            <strong>Technical Metadata:</strong> Browser type, operating system, IP address, and session timestamps used for security monitoring and fraud prevention.
                        </li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">3.</span> Purpose of Data Processing (Lawful Grounds)
                    </h2>
                    <p>We process your personal data solely for specified, lawful purposes with your explicit consent:</p>
                    <ul className="list-disc pl-6 space-y-1.5 text-sm text-[#444]">
                        <li>Providing and managing your user account and subscription quotas;</li>
                        <li>Segmenting and querying PDF book text to power interactive voice answers;</li>
                        <li>Delivering high-quality synthetic voice conversations via ElevenLabs & Vapi AI;</li>
                        <li>Ensuring platform security, bug debugging, and compliance with statutory Indian obligations.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">4.</span> Storage & Security Standards
                    </h2>
                    <p>
                        We enforce strict security practices under Rule 8 of the SPDI Rules, 2011, including encrypted HTTPS transmission in transit (TLS 1.3), hashed tokens, and encrypted database storage with MongoDB Atlas and Vercel infrastructure.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">5.</span> Rights of Data Principals (Under DPDP Act 2023)
                    </h2>
                    <p>Under Indian data protection regulations, you have the right to:</p>
                    <ul className="list-disc pl-6 space-y-1.5 text-sm text-[#444]">
                        <li><strong>Right to Access:</strong> Request a summary of your personal data processed by us;</li>
                        <li><strong>Right to Correction & Erasure:</strong> Request the correction of inaccurate data or complete deletion of your account and books;</li>
                        <li><strong>Right to Nominate:</strong> Nominate another individual to exercise your rights in the event of incapacity;</li>
                        <li><strong>Right of Grievance Redressal:</strong> Direct any privacy concerns directly to our designated Grievance Officer.</li>
                    </ul>
                </section>

                {/* Grievance Officer & Contact */}
                <section className="mt-8 p-6 rounded-xl bg-[#fbf9f5] border border-[#e6decb] space-y-4">
                    <div className="flex items-center gap-2">
                        <Lock className="w-6 h-6 text-[#663820]" />
                        <h2 className="text-lg font-bold text-[#212a3b]">
                            6. Data Protection & Grievance Officer Contact
                        </h2>
                    </div>
                    <p className="text-sm text-[#555]">
                        If you have any questions, wish to exercise your data principal rights under the DPDP Act 2023, or have a grievance regarding your privacy, please contact our designated officer:
                    </p>

                    <GrievanceOfficerCard className="mt-2 max-w-full sm:max-w-lg" />

                    <p className="text-xs text-[#777] mt-3">
                        Grievances will be addressed promptly in accordance with the statutory response timelines mandated under Indian data protection law.
                    </p>
                </section>
            </div>
        </main>
    );
}
