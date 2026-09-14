import React from 'react';
import { Shield, Scale } from 'lucide-react';
import BackToHomeButton from '@/components/BackToHomeButton';

export const metadata = {
    title: 'Terms and Conditions | Bookified',
    description: 'Terms and Conditions governing the use of Bookified in accordance with Indian Law and the Information Technology Act, 2000.',
};

export default function TermsPage() {
    return (
        <main className="wrapper py-12 max-w-4xl mx-auto text-[#212a3b]">
            <div className="mb-8">
                <div className="mb-4">
                    <BackToHomeButton />
                </div>
                <div className="flex items-center gap-3 mb-2">
                    <Scale className="w-8 h-8 text-[#663820]" />
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#212a3b]">Terms and Conditions</h1>
                </div>
                <p className="text-sm text-[#777]">
                    Last Updated: September 14, 2026 • Governed under the Laws of the Republic of India (Bharat)
                </p>
            </div>

            <div className="space-y-8 text-base leading-relaxed bg-white p-6 sm:p-10 rounded-2xl border border-gray-200/80 shadow-soft-sm">
                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">1.</span> Acceptance of Terms
                    </h2>
                    <p>
                        Welcome to <strong>Bookified™</strong> (&quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;). By accessing or using our website, uploading documents, or interacting with our voice AI services, you agree to be bound by these Terms and Conditions in accordance with the <strong>Indian Contract Act, 1872</strong> and the <strong>Information Technology Act, 2000</strong>, along with all applicable rules and amendments.
                    </p>
                    <p>
                        If you do not agree to these terms, please refrain from accessing or using the platform.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">2.</span> Service Description & AI Interactions
                    </h2>
                    <p>
                        Bookified provides an interactive platform enabling users to upload readable PDF documents, generate AI-synthesized summaries, and engage in real-time conversational voice sessions with an AI agent based on the document content.
                    </p>
                    <p>
                        You acknowledge that AI responses are generated algorithmically for educational and informational purposes and should not be construed as professional, legal, medical, or financial advice.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">3.</span> User Obligations & Acceptable Use
                    </h2>
                    <p>Under Rule 3(1)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, you agree not to upload, transmit, or share any material that:</p>
                    <ul className="list-disc pl-6 space-y-1.5 text-sm text-[#444]">
                        <li>Belongs to another person and to which you do not have any right or valid license;</li>
                        <li>Infringes any patent, trademark, copyright, or other proprietary rights;</li>
                        <li>Is grossly harmful, harassing, defamatory, obscene, pornographic, paedophilic, or invasive of another&apos;s privacy;</li>
                        <li>Threatens the unity, integrity, defence, security, or sovereignty of India, friendly relations with foreign States, or public order;</li>
                        <li>Contains software viruses or any computer code designed to interrupt, destroy, or limit platform functionality.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">4.</span> Intellectual Property & Content Ownership
                    </h2>
                    <p>
                        You retain full ownership of the PDF documents and content you upload. By uploading content, you grant Bookified a non-exclusive, temporary, royalty-free license solely for the technical purpose of text segmentation, synthesis, and powering voice conversations for your account.
                    </p>
                    <p>
                        All trademarks, branding, user interfaces, illustrations, and codebase of Bookified™ are protected under the <strong>Copyright Act, 1957</strong> and <strong>Trade Marks Act, 1999</strong> of India.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">5.</span> Subscriptions, Billing & Cancellations
                    </h2>
                    <p>
                        Subscriptions (Standard & Pro tiers) are billed on a recurring monthly basis. You can manage or cancel your subscription at any time via your user dashboard. Plan limits (number of books and monthly voice session duration) apply strictly according to your selected tier.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xl font-serif font-bold text-[#212a3b] flex items-center gap-2">
                        <span className="text-[#663820]">6.</span> Limitation of Liability & Jurisdiction
                    </h2>
                    <p>
                        To the fullest extent permitted under applicable law, Bookified and its creators shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the platform.
                    </p>
                    <p>
                        These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in <strong>Vadodara, Gujarat, Bharat</strong>.
                    </p>
                </section>

                {/* Grievance Redressal Mechanism */}
                <section className="mt-8 p-6 rounded-xl bg-[#fbf9f5] border border-[#e6decb] space-y-3">
                    <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#663820]" />
                        <h2 className="text-lg font-bold text-[#212a3b]">
                            7. Grievance Redressal Mechanism (Rule 3(2) IT Rules, 2021)
                        </h2>
                    </div>
                    <p className="text-sm text-[#555]">
                        In accordance with the Information Technology Act, 2000 and the Rules made thereunder, the designated Grievance Officer for Bookified is:
                    </p>
                    <div className="text-sm space-y-1 bg-white p-4 rounded-lg border border-[#e6decb]">
                        <p><strong>Grievance Officer:</strong> Nisarg Jayesh Delvadiya</p>
                        <p><strong>Email:</strong> <a href="mailto:nisarg.delvadiya1@zohomail.in" className="text-[#663820] underline">nisarg.delvadiya1@zohomail.in</a></p>
                        <p><strong>Address:</strong> Vadodara, Gujarat, Bharat</p>
                        <p className="text-xs text-[#777] mt-2">Any grievances will be acknowledged within 24 hours and disposed of within 15 days as mandated by Indian law.</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
