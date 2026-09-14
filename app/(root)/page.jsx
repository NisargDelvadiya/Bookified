import React from 'react';
import HeroSection from "@/components/HeroSection";
import BookCard from "@/components/BookCard";
import { getAllBooks } from "@/lib/actions/book.actions";
import Search from "@/components/Search";

const Page = async ({ searchParams }) => {
    const params = await searchParams;
    const query = params?.query;

    const bookResults = await getAllBooks(query);
    const books = bookResults?.success ? bookResults.data ?? [] : [];

    return (
        <main className="wrapper container pb-16">
            <HeroSection />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
                <h2 className="text-3xl font-serif font-bold text-[#212a3b]">Recent Books</h2>
                <Search />
            </div>

            {books.length > 0 ? (
                <div className="library-books-grid">
                    {books.map((book) => (
                        <BookCard
                            key={book._id}
                            title={book.title}
                            author={book.author}
                            coverURL={book.coverURL}
                            slug={book.slug}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No books found matching your query.</p>
                </div>
            )}
        </main>
    );
};

export default Page;
