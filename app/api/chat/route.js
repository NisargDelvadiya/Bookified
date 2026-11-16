import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import BookSegment from "@/database/models/book-segment.model";
import ChatConversation from "@/database/models/chat-conversation.model";
import mongoose from "mongoose";
import { escapeRegex } from "@/lib/utils";

// Search book segments for relevant context
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

// GET: Load saved conversation for this book and user
export async function GET(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ messages: [] });
        }

        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get("bookId");

        if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
            return NextResponse.json({ messages: [] });
        }

        await connectToDatabase();
        const conversation = await ChatConversation.findOne({
            clerkId: userId,
            bookId: new mongoose.Types.ObjectId(bookId),
        }).lean();

        if (!conversation || !conversation.messages) {
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json({
            messages: conversation.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        });
    } catch (e) {
        console.error("Error loading chat conversation:", e);
        return NextResponse.json({ messages: [] });
    }
}

// POST: Send new message, get AI response, and save to conversation
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

        const isContinuing = history.length > 0;

        const systemPrompt = `You are a knowledgeable, thoughtful, and engaging AI reading companion who has thoroughly read the book "${bookTitle}" by ${bookAuthor}.
${isContinuing ? "You are continuing an ongoing conversation with the reader. Seamlessly pick up from where you left off based on the conversation history." : ""}

Guidelines:
- Answer questions about the book's themes, characters, plot, arguments, and ideas
- Reference specific passages or ideas from the book when relevant
- Be conversational and engaging, not robotic
- If asked something outside the book's scope, gently redirect to book-related discussion
- Keep responses concise but insightful (2-4 paragraphs max)
${context ? `\nRelevant excerpts from the book to inform your response:\n\n${context}` : ""}`;

        // Build conversation history for Gemini (last 16 messages for context window management)
        const recentHistory = history.slice(-16);
        const contents = [
            ...recentHistory.map((h) => ({
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

        // Save both user message and AI response to MongoDB permanently
        if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
            try {
                await connectToDatabase();
                await ChatConversation.findOneAndUpdate(
                    {
                        clerkId: userId,
                        bookId: new mongoose.Types.ObjectId(bookId),
                    },
                    {
                        $push: {
                            messages: {
                                $each: [
                                    { role: "user", content: message },
                                    { role: "assistant", content: text },
                                ],
                            },
                        },
                    },
                    { upsert: true, new: true }
                );
            } catch (dbErr) {
                console.warn("Could not persist chat message to DB:", dbErr);
            }
        }

        return NextResponse.json({ response: text });
    } catch (e) {
        console.error("Chat API error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
