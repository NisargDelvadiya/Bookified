import React from 'react';

const BookCardSkeleton = () => {
    return (
        <div className="book-card animate-pulse">
            <div className="book-card-figure">
                <div className="book-card-cover-wrapper bg-gray-200/80 dark:bg-gray-700/50 rounded-lg w-[133px] h-[200px]" />
                <div className="book-card-meta space-y-2 mt-3 w-full px-1">
                    <div className="h-4 bg-gray-200/80 dark:bg-gray-700/50 rounded w-3/4" />
                    <div className="h-3 bg-gray-200/60 dark:bg-gray-700/40 rounded w-1/2" />
                </div>
            </div>
        </div>
    );
};

export default BookCardSkeleton;
