'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Mic, MicOff, Send, Bot, User, Loader2, RotateCcw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useVapi from "@/hooks/useVapi";
import { voiceOptions, DEFAULT_VOICE, voiceCategories } from "@/lib/constants";

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Copy text"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
};

const BookReader = ({ book }) => {
    const router = useRouter();
    const storageKey = `bookified_conv_${book?._id}`;
    const [selectedVoice, setSelectedVoice] = useState(book?.persona || DEFAULT_VOICE);

    const defaultGreeting = {
        role: "assistant",
        content: `Hi! I've read **"${book?.title}"** by ${book?.author}. Ask me anything about it via voice or text — we share one continuous conversation!`,
        mode: "text",
    };

    // Unified conversation state
    const [messages, setMessages] = useState(() => {
        if (typeof window !== "undefined" && book?._id) {
            try {
                const cached = localStorage.getItem(storageKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.warn("Failed to load cached conversation:", e);
            }
        }
        return [defaultGreeting];
    });

    // Append new message callback
    const addMessage = useCallback((newMsg) => {
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === newMsg.role && last.content === newMsg.content) {
                return prev;
            }
            const updated = [...prev, newMsg];
            try {
                localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch (e) {
                console.warn("Failed to cache message:", e);
            }
            return updated;
        });
    }, [storageKey]);

    // Vapi hook connected to the exact same shared message stream
    const {
        status,
        isActive,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        clearError,
        limitError,
        maxDurationSeconds,
    } = useVapi(book, selectedVoice, messages, addMessage);

    // Text input state
    const [input, setInput] = useState("");
    const [isTextLoading, setIsTextLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Sync with unified database conversation on mount
    useEffect(() => {
        if (!book?._id) return;

        let isMounted = true;
        fetch(`/api/chat?bookId=${book._id}`)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted && data.messages && data.messages.length > 0) {
                    setMessages((prev) => {
                        if (prev.length > data.messages.length + 1) return prev;
                        const merged = [defaultGreeting, ...data.messages];
                        try {
                            localStorage.setItem(storageKey, JSON.stringify(merged));
                        } catch (e) {
                            console.warn("Failed to cache conversation:", e);
                        }
                        return merged;
                    });
                }
            })
            .catch((err) => console.warn("Failed to sync unified conversation:", err));

        return () => {
            isMounted = false;
        };
    }, [book?._id, storageKey]);

    // Error handling
    useEffect(() => {
        if (limitError) {
            toast.error(limitError);
            router.push("/");
            clearError();
        }
    }, [limitError, router, clearError]);

    // Auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTextLoading, currentMessage, currentUserMessage]);

    // Send text message (Gemini)
    const handleSendText = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isTextLoading) return;

        const userMsg = { role: "user", content: text, mode: "text" };
        addMessage(userMsg);
        setInput("");
        setIsTextLoading(true);

        try {
            // Include both voice and text history so Gemini has complete context
            const history = messages
                .filter((m) => m.content && !m.content.startsWith("Hi! I've read"))
                .map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    bookId: book?._id,
                    bookTitle: book?.title,
                    bookAuthor: book?.author,
                    history: [...history, { role: "user", content: text }],
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                addMessage({
                    role: "assistant",
                    content: `⚠️ ${data.error || "Failed to get reply. Please try again."}`,
                    mode: "text",
                });
            } else {
                addMessage({
                    role: "assistant",
                    content: data.response,
                    mode: "text",
                });
            }
        } catch {
            addMessage({
                role: "assistant",
                content: "⚠️ Connection error. Please check your internet and try again.",
                mode: "text",
            });
        } finally {
            setIsTextLoading(false);
            inputRef.current?.focus();
        }
    };

    // Clear entire conversation (both voice and text)
    const handleClearConversation = async () => {
        if (!confirm("Clear this entire conversation history for this book?")) return;

        setMessages([defaultGreeting]);
        try {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(`bookified_voice_transcript_${book?._id}`);
            localStorage.removeItem(`bookified_chat_${book?._id}`);
        } catch (e) {
            console.warn("Failed to clear localStorage:", e);
        }

        try {
            await fetch(`/api/chat?bookId=${book?._id}`, { method: "DELETE" });
            toast.success("Conversation history cleared.");
        } catch (e) {
            console.warn("Failed to delete server conversation:", e);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendText(e);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusDisplay = () => {
        switch (status) {
            case 'connecting': return { label: 'Connecting...', color: 'vapi-status-dot-connecting' };
            case 'starting': return { label: 'Starting...', color: 'vapi-status-dot-starting' };
            case 'listening': return { label: 'Listening...', color: 'vapi-status-dot-listening' };
            case 'thinking': return { label: 'Thinking...', color: 'vapi-status-dot-thinking' };
            case 'speaking': return { label: 'Speaking...', color: 'vapi-status-dot-speaking' };
            default: return { label: 'Voice Ready', color: 'vapi-status-dot-ready' };
        }
    };

    const statusDisplay = getStatusDisplay();

    const renderFormattedContent = (content) => {
        return content
            .split("\n")
            .map((line, i) => {
                const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                return (
                    <span key={i}>
                        <span dangerouslySetInnerHTML={{ __html: formatted }} />
                        {i < content.split("\n").length - 1 && <br />}
                    </span>
                );
            });
    };

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            {/* Header Card: Book Info & Voice Assistant Controls */}
            <div className="vapi-header-card flex-col sm:flex-row items-center sm:items-start gap-5 p-6">
                {/* Book Cover + Mic Control */}
                <div className="vapi-cover-wrapper shrink-0">
                    <Image
                        src={book?.coverURL || "/images/book-placeholder.png"}
                        alt={book?.title || "Book Cover"}
                        width={110}
                        height={165}
                        className="vapi-cover-image !w-[110px] !h-auto"
                        priority
                    />
                    <div className="vapi-mic-wrapper relative">
                        {isActive && (status === 'speaking' || status === 'thinking' || status === 'listening') && (
                            <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-60" />
                        )}
                        <button
                            onClick={isActive ? stop : start}
                            disabled={status === 'connecting'}
                            aria-label={isActive ? "End voice call" : "Start voice call"}
                            aria-pressed={isActive}
                            title={isActive ? "Click to end voice conversation" : "Click to start voice conversation"}
                            className={`vapi-mic-btn shadow-md !w-[56px] !h-[56px] z-10 focus-visible:ring-4 focus-visible:ring-[#212a3b]/30 focus-visible:outline-none transition-all ${
                                isActive ? 'vapi-mic-btn-active scale-105' : 'vapi-mic-btn-inactive hover:scale-105'
                            }`}
                        >
                            {isActive ? (
                                <Mic className="size-6 text-white" aria-hidden="true" />
                            ) : (
                                <MicOff className="size-6 text-[#212a3b]" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Book Meta & Controls */}
                <div className="flex flex-col gap-3.5 flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#212a3b] leading-tight">
                                {book?.title}
                            </h1>
                            <p className="text-[#3d485e] font-medium text-base mt-0.5">by {book?.author}</p>
                        </div>

                        {messages.length > 1 && (
                            <button
                                onClick={handleClearConversation}
                                title="Clear conversation history"
                                className="inline-flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 w-fit self-center sm:self-auto"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Clear History</span>
                            </button>
                        )}
                    </div>

                    {/* Controls Row: Status, Voice Persona, Duration */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-sm">
                        <div className="vapi-status-indicator">
                            <span className={`vapi-status-dot ${statusDisplay.color}`} aria-hidden="true" />
                            <span className="vapi-status-text font-medium">{statusDisplay.label}</span>
                        </div>

                        <div className="vapi-status-indicator flex items-center gap-1.5">
                            <span className="vapi-status-text">Voice:</span>
                            <select
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                                disabled={isActive}
                                className="bg-transparent border-b border-gray-300 text-[#3d485e] font-medium focus:ring-0 cursor-pointer p-0 text-xs pb-0.5 outline-none"
                                title="Change voice assistant persona"
                            >
                                {Object.keys(voiceOptions).map((key) => {
                                    const isMale = voiceCategories.male.includes(key);
                                    const emoji = isMale ? "👨" : "👩";
                                    return (
                                        <option key={key} value={key}>
                                            {emoji} {voiceOptions[key].name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="vapi-status-indicator">
                            <span className="vapi-status-text">
                                {formatDuration(duration)}/{formatDuration(maxDurationSeconds)}
                            </span>
                        </div>
                    </div>

                    {/* Quick Call Tip */}
                    <p className="text-xs text-gray-500 mt-1">
                        {isActive
                            ? "🎙️ Voice call active — speak naturally into your microphone."
                            : "Click the mic above or type below to talk with this book."
                        }
                    </p>
                </div>
            </div>

            {/* ONE Unified Conversation Timeline */}
            <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Conversation Timeline
                    </h2>
                    <span className="text-xs text-gray-400">
                        {messages.length} messages
                    </span>
                </div>

                <div className="flex flex-col gap-4 min-h-[360px] max-h-[540px] overflow-y-auto px-1 py-2 scroll-smooth">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 items-start group ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                            {/* Avatar */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                    msg.role === "user"
                                        ? "bg-[#212a3b]"
                                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                }`}
                            >
                                {msg.role === "user" ? (
                                    <User className="w-4 h-4 text-white" />
                                ) : (
                                    <Bot className="w-4 h-4 text-white" />
                                )}
                            </div>

                            {/* Bubble */}
                            <div
                                className={`relative max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-[#212a3b] text-white rounded-tr-sm"
                                        : "bg-gray-50 border border-gray-200 shadow-xs text-[#212a3b] rounded-tl-sm"
                                }`}
                            >
                                {renderFormattedContent(msg.content)}

                                <div className={`flex items-center justify-between gap-3 mt-1.5 pt-1 border-t ${
                                    msg.role === "user" ? "border-white/10" : "border-gray-200/60"
                                }`}>
                                    {/* Mode badge */}
                                    <span
                                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                            msg.role === "user" ? "text-blue-200" : "text-gray-400"
                                        }`}
                                    >
                                        {msg.mode === "voice" ? (
                                            <>
                                                <Mic className="w-3 h-3 text-blue-400" />
                                                <span>voice</span>
                                            </>
                                        ) : (
                                            <span>text</span>
                                        )}
                                    </span>

                                    <CopyButton text={msg.content} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Live Streaming Voice: User speaking */}
                    {currentUserMessage && (
                        <div className="flex gap-3 items-start flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-[#212a3b] flex items-center justify-center shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-[#212a3b] text-white rounded-tr-sm">
                                {currentUserMessage}
                                <span className="transcript-cursor" />
                            </div>
                        </div>
                    )}

                    {/* Live Streaming Voice: Assistant speaking */}
                    {currentMessage && (
                        <div className="flex gap-3 items-start flex-row">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-gray-50 border border-gray-200 text-[#212a3b] rounded-tl-sm">
                                {currentMessage}
                                <span className="transcript-cursor" />
                            </div>
                        </div>
                    )}

                    {/* Text Loading Indicator */}
                    {isTextLoading && (
                        <div className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-50 border border-gray-200 shadow-xs px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Bottom Input Bar */}
                <form onSubmit={handleSendText} className="flex gap-2.5 items-end pt-2">
                    {/* Quick Mic Action Button */}
                    <button
                        type="button"
                        onClick={isActive ? stop : start}
                        disabled={status === 'connecting'}
                        title={isActive ? "End voice call" : "Start voice conversation"}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer ${
                            isActive
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {isActive ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5" />}
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isActive ? "Voice call is active... (or type here)" : `Ask anything about "${book?.title}"…`}
                        rows={1}
                        disabled={isTextLoading}
                        className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#212a3b] placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]/20 focus:border-[#212a3b]/40 transition-all disabled:opacity-50 leading-relaxed"
                        style={{ minHeight: "48px", maxHeight: "120px" }}
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                        }}
                    />

                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || isTextLoading}
                        aria-label="Send message"
                        className="w-12 h-12 rounded-2xl bg-[#212a3b] text-white flex items-center justify-center shrink-0 shadow-sm hover:bg-[#2f3d55] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isTextLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Enter</kbd> to send · Click the mic to speak · All conversations saved in this thread
                </p>
            </div>
        </div>
    );
};

export default BookReader;
