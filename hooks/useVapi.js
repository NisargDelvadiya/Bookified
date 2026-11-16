'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { useAuth } from '@clerk/nextjs';

import { ASSISTANT_ID, DEFAULT_VOICE, VOICE_SETTINGS } from '@/lib/constants';
import { getVoice } from '@/lib/utils';
import { startVoiceSession, endVoiceSession, getBookVoiceHistory } from '@/lib/actions/session.actions';

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

export function useVapi(book, customVoice = null) {
    const { userId } = useAuth();
    const storageKey = `bookified_voice_transcript_${book?._id}`;

    const [status, setStatus] = useState('idle');
    const [messages, setMessages] = useState(() => {
        if (typeof window !== "undefined" && book?._id) {
            try {
                const cached = localStorage.getItem(storageKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.warn("Failed to load cached voice transcript:", e);
            }
        }
        return [];
    });
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState(null);

    // Sync voice history from database on mount
    useEffect(() => {
        if (!book?._id) return;
        let isMounted = true;

        getBookVoiceHistory(book._id)
            .then((res) => {
                if (isMounted && res.success && res.messages && res.messages.length > 0) {
                    setMessages(res.messages);
                    try {
                        localStorage.setItem(storageKey, JSON.stringify(res.messages));
                    } catch (e) {
                        console.warn("Failed to cache voice transcript:", e);
                    }
                }
            })
            .catch((err) => console.warn("Failed to load voice history:", err));

        return () => {
            isMounted = false;
        };
    }, [book?._id, storageKey]);

    // Save transcript to localStorage whenever messages change
    useEffect(() => {
        if (typeof window !== "undefined" && book?._id && messages.length > 0) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            } catch (e) {
                console.warn("Failed to save transcript to localStorage:", e);
            }
        }
    }, [messages, book?._id, storageKey]);

    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const sessionIdRef = useRef(null);
    const isStoppingRef = useRef(false);

    const maxDurationSeconds = 60 * 60; // 60 minutes, unlimited
    const maxDurationRef = useLatestRef(maxDurationSeconds);
    const durationRef = useLatestRef(duration);
    const messagesRef = useLatestRef(messages);
    const voice = customVoice || book?.persona || DEFAULT_VOICE;

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
                                )} minutes) reached. Please start a new session.`,
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
                    endVoiceSession(sessionIdRef.current, durationRef.current, messagesRef.current).catch((err) =>
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
                        if (prev.length === 0) {
                            return [{ role: message.role, content: message.transcript }];
                        }
                        const lastMsg = prev[prev.length - 1];
                        
                        // Prevent exact duplicates
                        if (lastMsg.role === message.role && lastMsg.content.endsWith(message.transcript)) {
                            return prev;
                        }

                        // If the same role is speaking, merge the text into the same box (ChatGPT style)
                        if (lastMsg.role === message.role) {
                            const updatedLastMsg = { 
                                ...lastMsg, 
                                content: lastMsg.content + ' ' + message.transcript 
                            };
                            return [...prev.slice(0, -1), updatedLastMsg];
                        }
                        
                        // Otherwise, start a new box for the new role
                        return [...prev, { role: message.role, content: message.transcript }];
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
                    endVoiceSession(sessionIdRef.current, durationRef.current, messagesRef.current).catch((err) =>
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
                endVoiceSession(sessionIdRef.current, durationRef.current, messagesRef.current).catch((err) =>
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
        setStatus('connecting');

        try {
            const result = await startVoiceSession(userId, book._id);

            if (!result.success) {
                setLimitError(result.error || 'Failed to start session. Please try again.');
                setStatus('idle');
                return;
            }

            sessionIdRef.current = result.sessionId || null;

            const previousMessages = messagesRef.current || [];
            const isContinuing = previousMessages.length > 0;

            const firstMessage = isContinuing
                ? `Welcome back! Ready to continue our conversation about "${book.title}" from where we left off?`
                : `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;

            const previousContext = previousMessages
                .slice(-6)
                .map((m) => `${m.role === 'user' ? 'Reader' : 'Assistant'}: ${m.content}`)
                .join("\n");

            await instance.start(ASSISTANT_ID, {
                firstMessage,
                variableValues: {
                    title: book.title,
                    author: book.author,
                    bookId: book._id,
                    previousDiscussion: previousContext || "No prior discussion yet.",
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
        maxDurationSeconds,
        clearError,
    };
}

export default useVapi;
