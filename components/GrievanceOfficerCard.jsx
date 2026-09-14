import React from 'react';
import { ShieldCheck, User, Mail, MapPin, Globe, ExternalLink } from 'lucide-react';

export default function GrievanceOfficerCard({ className = '' }) {
    return (
        <div className={`p-4 sm:p-5 rounded-2xl bg-[#161d28] border border-gray-800/90 text-white shadow-soft-sm max-w-md ${className}`}>
            <div className="flex items-center gap-2 font-semibold text-white mb-3 text-sm sm:text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Grievance Officer (IT Rules, 2021)</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-200">Nisarg Jayesh Delvadiya</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                        href="https://www.nisargjayeshdelvadiya.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-gray-200 hover:text-white underline underline-offset-2 transition-colors"
                    >
                        <span>www.nisargjayeshdelvadiya.com</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
                <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <a
                        href="mailto:nisarg.delvadiya1@zohomail.in"
                        className="text-gray-200 hover:text-white underline underline-offset-2 transition-colors"
                    >
                        nisarg.delvadiya1@zohomail.in
                    </a>
                </div>
                <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-200">Vadodara, Gujarat, Bharat</span>
                </div>
            </div>
        </div>
    );
}
