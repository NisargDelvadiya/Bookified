'use client';

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare } from "lucide-react";

const TextChat = ({ book }) => {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: `Hi! I've read **"${book?.title}"** by ${book?.author}. Ask me anything about it — themes, characters, plot, quotes, or your thoughts on it!`,
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const sendMessage = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isLoading) return;

        const userMessage = { role: "user", content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Build history excluding the initial greeting
            const history = messages.slice(1);

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    bookId: book?._id,
                    bookTitle: book?.title,
                    bookAuthor: book?.author,
                    history,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: `⚠️ ${data.error || "Something went wrong. Please try again."}` },
                ]);
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "⚠️ Connection error. Please check your internet and try again." },
            ]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    };

    // Render message content with basic markdown (bold, line breaks)
    const renderContent = (content) => {
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
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {/* Chat Header */}
            <div className="vapi-header-card flex-row items-center gap-4 py-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#212a3b] flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#212a3b] text-lg leading-tight">{book?.title}</h2>
                        <p className="text-sm text-[#3d485e]">Text chat with AI · powered by Gemini</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-3 min-h-[400px] max-h-[520px] overflow-y-auto px-1 py-2 scroll-smooth">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 items-start ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
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
                            className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === "user"
                                    ? "bg-[#212a3b] text-white rounded-tr-sm"
                                    : "bg-white border border-gray-100 shadow-sm text-[#212a3b] rounded-tl-sm"
                            }`}
                        >
                            {renderContent(msg.content)}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-3 items-end">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask anything about "${book?.title}"…`}
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#212a3b] placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#212a3b]/20 focus:border-[#212a3b]/40 transition-all disabled:opacity-50 leading-relaxed"
                    style={{ minHeight: "48px", maxHeight: "120px" }}
                    onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className="w-12 h-12 rounded-2xl bg-[#212a3b] text-white flex items-center justify-center shrink-0 shadow-sm hover:bg-[#2f3d55] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Enter</kbd> to send · <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Shift+Enter</kbd> for new line
            </p>
        </div>
    );
};

export default TextChat;
