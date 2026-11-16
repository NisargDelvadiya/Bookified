import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/database/mongoose";
import BookSegment from "@/database/models/book-segment.model";
import ChatConversation from "@/database/models/chat-conversation.model";
import mongoose from "mongoose";
import { escapeRegex } from "@/lib/utils";
import { searchBookSegments } from "@/lib/actions/book.actions";

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
                models.find((m) => m === "gemini-3.8-flash") ||
                models.find((m) => m.includes("3.8-flash")) ||
                models.find((m) => m.includes("2.5-flash")) ||
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

    return "gemini-3.8-flash";
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

// Search book segments for relevant context using Vector & Semantic Search
async function getBookContext(bookId, query) {
    try {
        if (!bookId) return "";
        const result = await searchBookSegments(bookId, query, 3);
        if (result.success && result.data && result.data.length > 0) {
            return result.data.map((s) => s.content).join("\n\n---\n\n");
        }
        return "";
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
- Always finish your sentences and provide complete, well-rounded answers without cutting off mid-thought
- Keep responses readable and insightful (2-4 paragraphs max)
${context ? `\nRelevant excerpts from the book to inform your response:\n\n${context}` : ""}`;

        // Build properly alternating conversation history for Gemini fallback
        const contents = formatGeminiContents(history, message);

        let text = null;
        let lastError = null;

        // 1. Primary: Use Google's recommended Interactions API with gemini-3.8-flash
        const conversationTranscript = history
            .filter((h) => h.content && !h.content.startsWith("Hi! I've read"))
            .map((h) => `${h.role === "assistant" || h.role === "model" ? "Assistant" : "Reader"}: ${h.content}`)
            .join("\n\n");

        const fullPromptInput = conversationTranscript
            ? `Prior conversation history:\n${conversationTranscript}\n\nReader's latest message: ${message}`
            : message;

        try {
            const interactionsRes = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                    model: "gemini-3.8-flash",
                    system_instruction: systemPrompt,
                    input: fullPromptInput,
                    generation_config: {
                        thinking_level: "low",
                        max_output_tokens: 4096,
                    },
                }),
            });

            if (interactionsRes.ok) {
                const data = await interactionsRes.json();
                text =
                    data.output_text ||
                    data.outputs?.[0]?.text ||
                    data.steps?.find((s) => s.text)?.text ||
                    data.candidates?.[0]?.content?.parts?.[0]?.text;
            } else {
                const err = await interactionsRes.json();
                lastError = err?.error?.message || "Interactions API request failed";
                console.error("Interactions API error with gemini-3.8-flash:", err);
            }
        } catch (fetchErr) {
            lastError = fetchErr.message;
            console.error("Interactions API exception with gemini-3.8-flash:", fetchErr);
        }

        // 2. Secondary fallback: generateContent endpoint with active model
        if (!text) {
            const dynamicModel = await getAvailableModel(apiKey);
            const modelsToTry = [
                "gemini-3.8-flash",
                dynamicModel,
            ].filter((m, i, arr) => m && arr.indexOf(m) === i);

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
                                    maxOutputTokens: 4096,
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
