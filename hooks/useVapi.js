'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { useAuth } from '@clerk/nextjs';

import { useSubscription } from '@/hooks/useSubscription';
import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from '@/lib/constants';
import { getVoice } from '@/lib/utils';
import { startVoiceSession, endVoiceSession } from '@/lib/actions/session.actions';

export function useLatestRef(value) {
    const ref = useRef(value);

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref;
}

const TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;

let vapiInstance = null;

function getVapi() {
    if (typeof window === 'undefined') return null;
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
        console.warn('NEXT_PUBLIC_VAPI_API_KEY environment variable is not set.');
        return null;
    }
    if (!vapiInstance) {
        vapiInstance = new Vapi(apiKey);
    }
    return vapiInstance;
}

export function useVapi(book) {
    const { userId } = useAuth();
    const { limits } = useSubscription();

    const [status, setStatus] = useState('idle');
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState(null);
    const [isBillingError, setIsBillingError] = useState(false);

    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const sessionIdRef = useRef(null);
    const isStoppingRef = useRef(false);

    const maxDurationSeconds = limits?.maxDurationPerSession ? limits.maxDurationPerSession * 60 : (15 * 60);
    const maxDurationRef = useLatestRef(maxDurationSeconds);
    const durationRef = useLatestRef(duration);
    const voice = book?.persona || DEFAULT_VOICE;

    useEffect(() => {
        const instance = getVapi();
        if (!instance) return;

        const handlers = {
            'call-start': () => {
                isStoppingRef.current = false;
                setStatus('starting');
                setCurrentMessage('');
                setCurrentUserMessage('');

                startTimeRef.current = Date.now();
                setDuration(0);
                timerRef.current = setInterval(() => {
                    if (startTimeRef.current) {
                        const newDuration = Math.floor((Date.now() - startTimeRef.current) / TIMER_INTERVAL_MS);
                        setDuration(newDuration);

                        if (newDuration >= maxDurationRef.current) {
                            instance.stop();
                            setLimitError(
                                `Session time limit (${Math.floor(
                                    maxDurationRef.current / SECONDS_PER_MINUTE,
                                )} minutes) reached. Upgrade your plan for longer sessions.`,
                            );
                        }
                    }
                }, TIMER_INTERVAL_MS);
            },

            'call-end': () => {
                setStatus('idle');
                setCurrentMessage('');
                setCurrentUserMessage('');

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                if (sessionIdRef.current) {
                    endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                        console.error('Failed to end voice session:', err),
                    );
                    sessionIdRef.current = null;
                }

                startTimeRef.current = null;
            },

            'speech-start': () => {
                if (!isStoppingRef.current) {
                    setStatus('speaking');
                }
            },
            'speech-end': () => {
                if (!isStoppingRef.current) {
                    setStatus('listening');
                }
            },

            message: (message) => {
                if (message.type !== 'transcript') return;

                if (message.role === 'user' && message.transcriptType === 'final') {
                    if (!isStoppingRef.current) {
                        setStatus('thinking');
                    }
                    setCurrentUserMessage('');
                }

                if (message.role === 'user' && message.transcriptType === 'partial') {
                    setCurrentUserMessage(message.transcript);
                    return;
                }

                if (message.role === 'assistant' && message.transcriptType === 'partial') {
                    setCurrentMessage(message.transcript);
                    return;
                }

                if (message.transcriptType === 'final') {
                    if (message.role === 'assistant') setCurrentMessage('');
                    if (message.role === 'user') setCurrentUserMessage('');

                    setMessages((prev) => {
                        const isDupe = prev.some(
                            (m) => m.role === message.role && m.content === message.transcript,
                        );
                        return isDupe ? prev : [...prev, { role: message.role, content: message.transcript }];
                    });
                }
            },

            error: (error) => {
                console.error('Vapi error:', error);
                setStatus('idle');
                setCurrentMessage('');
                setCurrentUserMessage('');

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                if (sessionIdRef.current) {
                    endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                        console.error('Failed to end voice session on error:', err),
                    );
                    sessionIdRef.current = null;
                }

                const errorMessage = error?.message?.toLowerCase() || '';
                if (errorMessage.includes('timeout') || errorMessage.includes('silence')) {
                    setLimitError('Session ended due to inactivity. Click the mic to start again.');
                } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                    setLimitError('Connection lost. Please check your internet and try again.');
                } else {
                    setLimitError('Session ended unexpectedly. Click the mic to start again.');
                }

                startTimeRef.current = null;
            },
        };

        Object.entries(handlers).forEach(([event, handler]) => {
            instance.on(event, handler);
        });

        return () => {
            if (sessionIdRef.current) {
                instance.stop();
                endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                    console.error('Failed to end voice session on unmount:', err),
                );
                sessionIdRef.current = null;
            }
            Object.entries(handlers).forEach(([event, handler]) => {
                instance.off(event, handler);
            });
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const start = useCallback(async () => {
        if (!userId) {
            setLimitError('Please sign in to start a voice session.');
            return;
        }

        const instance = getVapi();
        if (!instance) {
            setLimitError('Vapi Public API Key (NEXT_PUBLIC_VAPI_API_KEY) is not set in environment variables.');
            return;
        }

        setLimitError(null);
        setIsBillingError(false);
        setStatus('connecting');

        try {
            const result = await startVoiceSession(userId, book._id);

            if (!result.success) {
                setLimitError(result.error || 'Session limit reached. Please upgrade your plan.');
                setIsBillingError(!!result.isBillingError);
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;

            const firstMessage = `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;

            await instance.start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                },
                voice: {
                    provider: '11labs',
                    voiceId: getVoice(voice).id,
                    model: 'eleven_turbo_v2_5',
                    stability: VOICE_SETTINGS.stability,
                    similarityBoost: VOICE_SETTINGS.similarityBoost,
                    style: VOICE_SETTINGS.style,
                    useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
                },
            });
        } catch (err) {
            console.error('Failed to start call:', err);
            setStatus('idle');
            setLimitError('Failed to start voice session. Please try again.');
        }
    }, [book?._id, book?.title, book?.author, voice, userId]);

    const stop = useCallback(() => {
        isStoppingRef.current = true;
        const instance = getVapi();
        instance?.stop();
    }, []);

    const clearError = useCallback(() => {
        setLimitError(null);
        setIsBillingError(false);
    }, []);

    const isActive =
        status === 'starting' ||
        status === 'listening' ||
        status === 'thinking' ||
        status === 'speaking';

    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        limitError,
        isBillingError,
        maxDurationSeconds,
        clearError,
    };
}

export default useVapi;
