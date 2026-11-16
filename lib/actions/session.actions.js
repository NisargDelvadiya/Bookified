'use server';

import { connectToDatabase } from "@/database/mongoose";
import VoiceSession from "@/database/models/voice-session.model";

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
