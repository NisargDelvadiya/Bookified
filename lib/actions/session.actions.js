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

        const sessions = await VoiceSession.find({
            clerkId: userId,
            bookId,
        })
            .sort({ startedAt: 1 })
            .select("transcript")
            .lean();

        const allMessages = [];
        sessions.forEach((s) => {
            if (Array.isArray(s.transcript)) {
                allMessages.push(...s.transcript);
            }
        });

        return {
            success: true,
            messages: serializeData(allMessages),
        };
    } catch (e) {
        console.error("Error fetching book voice history:", e);
        return { success: false, messages: [] };
    }
};
