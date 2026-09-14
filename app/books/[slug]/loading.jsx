import React from 'react';
import { Loader2 } from 'lucide-react';

export default function BookDetailLoading() {
    return (
        <main className="wrapper py-10">
            <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-pulse">
                {/* Header Card Skeleton */}
                <div className="vapi-header-card bg-gray-100/80 rounded-2xl p-6 min-h-[200px] flex items-center gap-6">
                    <div className="w-[120px] h-[180px] bg-gray-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-2/3" />
                        <div className="h-5 bg-gray-200 rounded w-1/3" />
                        <div className="flex gap-3 pt-2">
                            <div className="h-7 bg-gray-200 rounded-full w-24" />
                            <div className="h-7 bg-gray-200 rounded-full w-32" />
                        </div>
                    </div>
                </div>

                {/* Transcript Skeleton */}
                <div className="vapi-transcript-wrapper bg-gray-50/60 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#663820]" />
                    <p className="text-sm font-medium">Loading book & audio engine...</p>
                </div>
            </div>
        </main>
    );
}
