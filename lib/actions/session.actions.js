'use server';

import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";
import Book from "@/database/models/book.model";
import { serializeData } from "@/lib/utils";

export const startVoiceSession = async (clerkId, bookId) => {
    try {
        await connectToDatabase();

        const session = await VoiceSession.create({
            clerkId,
            bookId,
            startedAt: new Date(),
            billingPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0),
            durationSeconds: 0,
        });

        return {
            success: true,
            sessionId: session._id.toString(),
        };
    } catch (e) {
        console.error('Error starting voice session', e);
        return { success: false, error: 'Failed to start voice session. Please try again later.' };
    }
};

export const endVoiceSession = async (sessionId, durationSeconds, transcript = []) => {
    try {
        await connectToDatabase();

        const result = await VoiceSession.findByIdAndUpdate(sessionId, {
            endedAt: new Date(),
            durationSeconds,
            transcript,
        });

        if (!result) return { success: false, error: 'Voice session not found.' };

        // Save voice messages to unified ChatConversation
        if (result.clerkId && result.bookId && Array.isArray(transcript) && transcript.length > 0) {
            try {
                const ChatConversation = (await import("@/database/models/chat-conversation.model")).default;
                const formatted = transcript.map((m) => ({
                    role: m.role,
                    content: m.content,
                    mode: 'voice',
                    createdAt: new Date(),
                }));

                await ChatConversation.findOneAndUpdate(
                    { clerkId: result.clerkId, bookId: result.bookId },
                    { $push: { messages: { $each: formatted } } },
                    { upsert: true, new: true }
                );
            } catch (convErr) {
                console.warn("Could not sync voice transcript to unified conversation:", convErr);
            }
        }

        return { success: true };
    } catch (e) {
        console.error('Error ending voice session', e);
        return { success: false, error: 'Failed to end voice session. Please try again later.' };
    }
};

export const getUserVoiceSessions = async () => {
    try {
        await connectToDatabase();

        const { auth } = await import("@clerk/nextjs/server");
        const { userId } = await auth();

        if (!userId) {
            return { success: true, data: [] };
        }

        // Ensure Book model is loaded for populate
        const _ = Book;

        const sessions = await VoiceSession.find({ clerkId: userId })
            .populate('bookId')
            .sort({ startedAt: -1 })
            .lean();

        return {
            success: true,
            data: serializeData(sessions),
        };
    } catch (e) {
        console.error('Error fetching user voice sessions', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : String(e),
        };
    }
};



export const getBookVoiceHistory = async (bookId) => {
    try {
        await connectToDatabase();

        const { auth } = await import("@clerk/nextjs/server");
        const { userId } = await auth();

        if (!userId || !bookId) {
            return { success: true, messages: [] };
        }

        const ChatConversation = (await import("@/database/models/chat-conversation.model")).default;
        const conv = await ChatConversation.findOne({
            clerkId: userId,
            bookId,
        }).lean();

        if (conv && conv.messages && conv.messages.length > 0) {
            return {
                success: true,
                messages: serializeData(conv.messages),
            };
        }

        return {
            success: true,
            messages: [],
        };
    } catch (e) {
        console.error("Error fetching book voice history:", e);
        return { success: false, messages: [] };
    }
};

export const clearBookConversation = async (bookId) => {
    try {
        await connectToDatabase();
        const mongoose = (await import("mongoose")).default;
        const ChatConversation = (await import("@/database/models/chat-conversation.model")).default;
        const VoiceSession = (await import("@/database/models/voice-session.model")).default;

        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Delete from ChatConversation
        await ChatConversation.deleteMany({ bookId: bookObjectId });

        // Delete from VoiceSession
        await VoiceSession.deleteMany({ bookId: bookObjectId });

        return { success: true };
    } catch (e) {
        console.error("Error clearing book conversation:", e);
        return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
};
