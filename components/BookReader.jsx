'use client';

import { useState, useEffect, useCallback } from "react";
import { Mic, MessageSquare } from "lucide-react";
import VapiControls from "@/components/VapiControls";
import TextChat from "@/components/TextChat";

const TABS = [
    { id: "voice", label: "Voice Chat", icon: Mic },
    { id: "text", label: "Text Chat", icon: MessageSquare },
];

const BookReader = ({ book }) => {
    const [activeTab, setActiveTab] = useState("voice");
    const storageKey = `bookified_conv_${book?._id}`;

    const defaultGreeting = {
        role: "assistant",
        content: `Hi! I've read **"${book?.title}"** by ${book?.author}. Ask me anything about it via voice or text — I remember our entire conversation!`,
        mode: "text",
    };

    // Load initial unified conversation from localStorage
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

    // Fetch unified history from server on mount
    useEffect(() => {
        if (!book?._id) return;

        let isMounted = true;
        fetch(`/api/chat?bookId=${book._id}`)
            .then((res) => res.json())
            .then((data) => {
                if (isMounted && data.messages && data.messages.length > 0) {
                    setMessages((prev) => {
                        // Don't overwrite if local has more recent messages
                        if (prev.length > data.messages.length + 1) return prev;
                        const merged = [defaultGreeting, ...data.messages];
                        try {
                            localStorage.setItem(storageKey, JSON.stringify(merged));
                        } catch (e) {
                            console.warn("Failed to cache unified conversation:", e);
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

    // Persist messages to localStorage whenever updated
    useEffect(() => {
        if (typeof window !== "undefined" && book?._id && messages.length > 1) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(messages));
            } catch (e) {
                console.warn("Failed to save unified conversation:", e);
            }
        }
    }, [messages, book?._id, storageKey]);

    // Append new message to the unified conversation
    const addMessage = useCallback((newMsg) => {
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            // If the same role is speaking in sequence during streaming/merging
            if (last && last.role === newMsg.role && last.content === newMsg.content) {
                return prev;
            }
            const updated = [...prev, newMsg];
            try {
                localStorage.setItem(storageKey, JSON.stringify(updated));
            } catch (e) {
                console.warn("Failed to save message:", e);
            }
            return updated;
        });
    }, [storageKey]);

    // Clear unified conversation
    const clearConversation = useCallback(() => {
        if (confirm("Clear this book's conversation history (both voice and text)?")) {
            setMessages([defaultGreeting]);
            try {
                localStorage.removeItem(storageKey);
            } catch (e) {
                console.warn("Failed to clear conversation cache:", e);
            }
        }
    }, [defaultGreeting, storageKey]);

    return (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mx-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                            activeTab === id
                                ? "bg-white text-[#212a3b] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content - Both kept mounted with shared conversation */}
            <div>
                <div className={activeTab === "voice" ? "block" : "hidden"}>
                    <VapiControls
                        book={book}
                        messages={messages}
                        onAddMessage={addMessage}
                    />
                </div>
                <div className={activeTab === "text" ? "block" : "hidden"}>
                    <TextChat
                        book={book}
                        messages={messages}
                        onAddMessage={addMessage}
                        onClearConversation={clearConversation}
                    />
                </div>
            </div>
        </div>
    );
};

export default BookReader;
