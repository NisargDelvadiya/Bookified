import React from 'react';
import BookCardSkeleton from '@/components/BookCardSkeleton';

export default function Loading() {
    return (
        <main className="wrapper pb-16">
            {/* Hero Skeleton */}
            <div className="library-hero-card mb-10 md:mb-16 animate-pulse bg-gray-100/80 rounded-3xl min-h-[320px]" />

            {/* Books Grid Skeleton */}
            <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
                <div className="library-books-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <BookCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </main>
    );
}
