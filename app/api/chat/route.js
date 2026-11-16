import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import BookSegment from "@/database/models/book-segment.model";
import ChatConversation from "@/database/models/chat-conversation.model";
import mongoose from "mongoose";
import { escapeRegex } from "@/lib/utils";

let cachedModel = null;
let lastModelCheck = 0;

// Query Google ModelService.ListModels dynamically to select an active model supported by the API key
async function getAvailableModel(apiKey) {
    const now = Date.now();
    if (cachedModel && now - lastModelCheck < 10 * 60 * 1000) {
        return cachedModel;
    }

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (res.ok) {
            const data = await res.json();
            const models = (data.models || [])
                .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
                .map((m) => m.name.replace(/^models\//, ""));

            const chosen =
                models.find((m) => m.includes("flash") && !m.includes("8b") && !m.includes("preview")) ||
                models.find((m) => m.includes("flash")) ||
                models.find((m) => m.includes("gemini")) ||
                models[0];

            if (chosen) {
                cachedModel = chosen;
                lastModelCheck = now;
                return chosen;
            }
        }
    } catch (e) {
        console.warn("Could not list models, using default:", e);
    }

    return "gemini-1.5-flash";
}

// Format conversation history to strictly comply with Gemini API requirements:
// 1. Roles must be 'user' or 'model'
// 2. Multiturn turns must strictly alternate (merge consecutive turns of same role)
// 3. First turn must be 'user'
function formatGeminiContents(history = [], currentMessage = "") {
    const rawItems = [
        ...history
            .filter((h) => h.content && typeof h.content === "string" && h.content.trim().length > 0)
            .map((h) => ({
                role: h.role === "assistant" || h.role === "model" ? "model" : "user",
                text: h.content.trim(),
            })),
    ];

    if (currentMessage && currentMessage.trim()) {
        rawItems.push({ role: "user", text: currentMessage.trim() });
    }

    // Merge consecutive messages with the same role into one turn
    const merged = [];
    for (const item of rawItems) {
        if (merged.length > 0 && merged[merged.length - 1].role === item.role) {
            merged[merged.length - 1].text += "\n\n" + item.text;
        } else {
            merged.push({ role: item.role, text: item.text });
        }
    }

    // Gemini requires conversation to start with 'user'
    while (merged.length > 0 && merged[0].role !== "user") {
        merged.shift();
    }

    if (merged.length === 0) {
        merged.push({ role: "user", text: currentMessage.trim() });
    }

    // Keep last 16 turns for context
    const recent = merged.slice(-16);

    return recent.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
    }));
}

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
                .limit(2)
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
                    .limit(2)
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
                mode: m.mode || 'text',
                createdAt: m.createdAt,
            })),
        });
    } catch (e) {
        console.error("Error loading chat conversation:", e);
        return NextResponse.json({ messages: [] });
    }
}

// DELETE: Clear conversation for this book and user
export async function DELETE(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const bookId = searchParams.get("bookId");

        if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
            return NextResponse.json({ error: "Invalid book ID" }, { status: 400 });
        }

        await connectToDatabase();
        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        await ChatConversation.deleteMany({
            bookId: bookObjectId,
        });

        // Also clean up old legacy voice session transcripts for this book
        try {
            const VoiceSession = (await import("@/database/models/voice-session.model")).default;
            await VoiceSession.deleteMany({
                bookId: bookObjectId,
            });
        } catch (vErr) {
            console.warn("Could not delete legacy voice sessions:", vErr);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting conversation:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

        // Build properly alternating conversation history for Gemini
        const contents = formatGeminiContents(history, message);

        const dynamicModel = await getAvailableModel(apiKey);
        const modelsToTry = [
            dynamicModel,
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-2.0-flash",
        ].filter((m, i, arr) => m && arr.indexOf(m) === i);

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
                                maxOutputTokens: 600,
                                topP: 0.85,
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
                    console.error(`Gemini API error with ${modelName}:`, err);
                }
            } catch (fetchErr) {
                lastError = fetchErr.message;
                console.error(`Fetch exception with ${modelName}:`, fetchErr);
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
                                    { role: "user", content: message, mode: "text" },
                                    { role: "assistant", content: text, mode: "text" },
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
