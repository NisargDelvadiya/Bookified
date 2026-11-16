'use client';

import { useState } from "react";
import { Mic, MessageSquare } from "lucide-react";
import VapiControls from "@/components/VapiControls";
import TextChat from "@/components/TextChat";

const TABS = [
    { id: "voice", label: "Voice Chat", icon: Mic },
    { id: "text", label: "Text Chat", icon: MessageSquare },
];

const BookReader = ({ book }) => {
    const [activeTab, setActiveTab] = useState("voice");

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

            {/* Tab Content - Kept mounted to preserve active conversation state and draft text */}
            <div>
                <div className={activeTab === "voice" ? "block" : "hidden"}>
                    <VapiControls book={book} />
                </div>
                <div className={activeTab === "text" ? "block" : "hidden"}>
                    <TextChat book={book} />
                </div>
            </div>
        </div>
    );
};

export default BookReader;
