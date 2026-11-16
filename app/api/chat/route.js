import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { escapeRegex } from "@/lib/utils";

// Search book segments for relevant context (server-side, not a server action import)
async function getBookContext(bookId, query) {
    try {
        await connectToDatabase();

        if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) return "";

        const bookObjectId = new mongoose.Types.ObjectId(bookId);
        let segments = [];

        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select("content")
                .sort({ score: { $meta: "textScore" } })
                .limit(4)
                .lean();
        } catch {
            segments = [];
        }

        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);
            const pattern = keywords.map(escapeRegex).join("|");
            if (pattern) {
                segments = await BookSegment.find({
                    bookId: bookObjectId,
                    content: { $regex: pattern, $options: "i" },
                })
                    .select("content")
                    .sort({ segmentIndex: 1 })
                    .limit(4)
                    .lean();
            }
        }

        return segments.map((s) => s.content).join("\n\n---\n\n");
    } catch (e) {
        console.error("Error fetching book context:", e);
        return "";
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, bookId, bookTitle, bookAuthor, history = [] } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not configured. Add it to your .env.local file." },
                { status: 500 }
            );
        }

        // Fetch relevant book context
        const context = await getBookContext(bookId, message);

        const systemPrompt = `You are a knowledgeable and engaging AI reading companion who has thoroughly read the book "${bookTitle}" by ${bookAuthor}. Your role is to have intelligent, thoughtful conversations about this book with the reader.

Guidelines:
- Answer questions about the book's themes, characters, plot, arguments, and ideas
- Reference specific passages or ideas from the book when relevant
- Be conversational and engaging, not robotic
- If asked something outside the book's scope, gently redirect to book-related discussion
- Keep responses concise but insightful (2-4 paragraphs max)
${context ? `\nRelevant excerpts from the book to inform your response:\n\n${context}` : ""}`;

        // Build conversation history for Gemini
        const contents = [
            ...history.map((h) => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }],
            })),
            { role: "user", parts: [{ text: message }] },
        ];

        // Try latest models with automatic fallback
        const modelsToTry = [
            "gemini-3.8-flash",
            "gemini-2.5-flash",
            "gemini-1.5-flash",
        ];

        let text = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const geminiResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            system_instruction: { parts: [{ text: systemPrompt }] },
                            contents,
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 1024,
                                topP: 0.9,
                            },
                        }),
                    }
                );

                if (geminiResponse.ok) {
                    const data = await geminiResponse.json();
                    text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) break;
                } else {
                    const err = await geminiResponse.json();
                    lastError = err?.error?.message || `Model ${modelName} request failed`;
                    console.warn(`Failed with ${modelName}:`, lastError);
                }
            } catch (fetchErr) {
                lastError = fetchErr.message;
            }
        }

        if (!text) {
            return NextResponse.json(
                { error: lastError || "Failed to generate AI response" },
                { status: 502 }
            );
        }

        return NextResponse.json({ response: text });
    } catch (e) {
        console.error("Chat API error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
