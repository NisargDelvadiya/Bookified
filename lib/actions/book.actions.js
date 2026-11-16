'use server';

import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { getEmbedding, getBatchEmbeddings, cosineSimilarity } from "@/lib/embeddings";

export const getAllBooks = async (search) => {
    try {
        await connectToDatabase();

        let query = {};

        if (search) {
            const escapedSearch = escapeRegex(search);
            const regex = new RegExp(escapedSearch, 'i');
            query = {
                $or: [
                    { title: { $regex: regex } },
                    { author: { $regex: regex } },
                ]
            };
        }

        const books = await Book.find(query).sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books)
        };
    } catch (e) {
        console.error('Error connecting to database', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e)
        };
    }
};

export const checkBookExists = async (title) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);
        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                exists: true,
                book: serializeData(existingBook)
            };
        }

        return {
            exists: false,
        };
    } catch (e) {
        console.error('Error checking book exists', e);
        return {
            exists: false,
            error: e instanceof Error ? e.message : String(e)
        };
    }
};

export const createBook = async (data) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);
        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true,
            };
        }

        const { auth } = await import("@clerk/nextjs/server");
        const { userId } = await auth();

        if (!userId || userId !== data.clerkId) {
            return { success: false, error: "Unauthorized" };
        }

        const book = await Book.create({ ...data, clerkId: userId, slug, totalSegments: 0 });

        return {
            success: true,
            data: serializeData(book),
        };
    } catch (e) {
        console.error('Error creating a book', e);

        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};

export const getBookBySlug = async (slug) => {
    try {
        await connectToDatabase();

        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return { success: false, error: 'Book not found' };
        }

        return {
            success: true,
            data: serializeData(book)
        };
    } catch (e) {
        console.error('Error fetching book by slug', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e)
        };
    }
};

export const saveBookSegments = async (bookId, clerkId, segments) => {
    try {
        await connectToDatabase();

        const { auth } = await import("@clerk/nextjs/server");
        const { userId } = await auth();

        if (!userId || userId !== clerkId) {
            return { success: false, error: "Unauthorized operation" };
        }

        if (!mongoose.Types.ObjectId.isValid(bookId)) {
            return { success: false, error: "Invalid book identifier" };
        }

        console.log('Generating vector embeddings for book segments...');
        let embeddings = [];
        try {
            const texts = segments.map((s) => s.text);
            embeddings = await getBatchEmbeddings(texts);
        } catch (embedErr) {
            console.warn("Could not generate batch embeddings:", embedErr);
            embeddings = [];
        }

        const segmentsToInsert = segments.map(({ text, segmentIndex, pageNumber, wordCount }, i) => ({
            clerkId,
            bookId,
            content: text,
            segmentIndex,
            pageNumber,
            wordCount,
            ...(embeddings[i] ? { embedding: embeddings[i] } : {}),
        }));

        await BookSegment.insertMany(segmentsToInsert);
        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log(`Book segments saved successfully (${embeddings.filter(Boolean).length} embedded).`);

        return {
            success: true,
            data: { segmentsCreated: segments.length }
        };
    } catch (e) {
        console.error('Error saving book segments', e);

        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};

// Searches book segments using Semantic Vector Search with MongoDB text/regex fallback
export const searchBookSegments = async (bookId, query, limit = 5) => {
    try {
        await connectToDatabase();

        if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
            return { success: false, error: "Invalid book identifier", data: [] };
        }

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // 1. Try Semantic Vector Search
        try {
            const queryVector = await getEmbedding(query);

            if (queryVector && queryVector.length > 0) {
                // Method A: MongoDB Atlas $vectorSearch (if Atlas Vector Search Index is enabled)
                try {
                    const atlasResults = await BookSegment.aggregate([
                        {
                            $vectorSearch: {
                                index: "vector_index",
                                path: "embedding",
                                queryVector,
                                numCandidates: limit * 10,
                                limit,
                                filter: { bookId: bookObjectId },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                bookId: 1,
                                content: 1,
                                segmentIndex: 1,
                                pageNumber: 1,
                                wordCount: 1,
                            },
                        },
                    ]);

                    if (atlasResults && atlasResults.length > 0) {
                        return {
                            success: true,
                            data: serializeData(atlasResults),
                            mode: "vector-atlas",
                        };
                    }
                } catch {
                    // Atlas index not created or running locally, proceed to in-memory cosine
                }

                // Method B: In-memory Cosine Similarity on this book's segments
                const embeddedSegments = await BookSegment.find({
                    bookId: bookObjectId,
                    embedding: { $exists: true, $ne: [] },
                })
                    .select('_id bookId content segmentIndex pageNumber wordCount embedding')
                    .lean();

                if (embeddedSegments && embeddedSegments.length > 0) {
                    const scored = embeddedSegments.map((s) => ({
                        ...s,
                        similarity: cosineSimilarity(queryVector, s.embedding),
                    }));

                    scored.sort((a, b) => b.similarity - a.similarity);
                    const topSegments = scored.slice(0, limit).map(({ embedding, similarity, ...rest }) => rest);

                    return {
                        success: true,
                        data: serializeData(topSegments),
                        mode: "vector-cosine",
                    };
                }
            }
        } catch (vecErr) {
            console.warn("Vector search exception, falling back to text search:", vecErr);
        }

        // 2. Fallback: MongoDB Text Search with regex
        console.log(`Fallback: searching text for: "${query}" in book ${bookId}`);

        let segments = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        } catch {
            segments = [];
        }

        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);
            const pattern = keywords.map(escapeRegex).join('|');

            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })
                .limit(limit)
                .lean();
        }

        return {
            success: true,
            data: serializeData(segments),
            mode: "keyword",
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            data: [],
        };
    }
};


export const deleteBook = async (bookId) => {
    try {
        await connectToDatabase();

        if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
            return { success: false, error: "Invalid book identifier" };
        }

        const book = await Book.findById(bookId).lean();

        if (!book) {
            return { success: false, error: "Book not found" };
        }

        // Delete from Vercel Blob storage
        try {
            const { del } = await import("@vercel/blob");
            const keysToDelete = [book.fileBlobKey, book.coverBlobKey].filter(Boolean);
            if (keysToDelete.length > 0) {
                await del(keysToDelete);
            }
        } catch (blobErr) {
            console.warn("Could not delete blob files:", blobErr);
        }

        // Delete segments and book from DB
        await BookSegment.deleteMany({ bookId: book._id });
        await Book.findByIdAndDelete(bookId);

        revalidatePath("/");

        return { success: true };
    } catch (e) {
        console.error("Error deleting book:", e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};
