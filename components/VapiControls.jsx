'use client';

import { Mic, MicOff } from "lucide-react";
import useVapi from "@/hooks/useVapi";
import Image from "next/image";
import Transcript from "@/components/Transcript";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const VapiControls = ({ book }) => {
    const {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        clearError,
        limitError,
        isBillingError,
        maxDurationSeconds,
    } = useVapi(book);

    const router = useRouter();
    const [showTranscript, setShowTranscript] = useState(false);

    useEffect(() => {
        if (limitError) {
            toast.error(limitError);
            if (isBillingError) {
                router.push("/subscriptions");
            } else {
                router.push("/");
            }
            clearError();
        }
    }, [isBillingError, limitError, router, clearError]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusDisplay = () => {
        switch (status) {
            case 'connecting': return { label: 'Connecting...', color: 'vapi-status-dot-connecting' };
            case 'starting': return { label: 'Starting...', color: 'vapi-status-dot-starting' };
            case 'listening': return { label: 'Listening', color: 'vapi-status-dot-listening' };
            case 'thinking': return { label: 'Thinking...', color: 'vapi-status-dot-thinking' };
            case 'speaking': return { label: 'Speaking', color: 'vapi-status-dot-speaking' };
            default: return { label: 'Ready', color: 'vapi-status-dot-ready' };
        }
    };

    const statusDisplay = getStatusDisplay();

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            {/* Header Card */}
            <div className="vapi-header-card">
                <div className="vapi-cover-wrapper">
                    <Image
                        src={book?.coverURL || "/images/book-placeholder.png"}
                        alt={book?.title || "Book Cover"}
                        width={120}
                        height={180}
                        className="vapi-cover-image !w-[120px] !h-auto"
                        priority
                    />
                    <div className="vapi-mic-wrapper relative">
                        {isActive && (status === 'speaking' || status === 'thinking') && (
                            <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                        )}
                        <button
                            onClick={isActive ? stop : start}
                            disabled={status === 'connecting'}
                            aria-label={isActive ? "End voice conversation" : "Start voice conversation with book"}
                            aria-pressed={isActive}
                            className={`vapi-mic-btn shadow-md !w-[60px] !h-[60px] z-10 focus-visible:ring-4 focus-visible:ring-[#212a3b]/30 focus-visible:outline-none ${isActive ? 'vapi-mic-btn-active' : 'vapi-mic-btn-inactive'}`}
                        >
                            {isActive ? (
                                <Mic className="size-7 text-white" aria-hidden="true" />
                            ) : (
                                <MicOff className="size-7 text-[#212a3b]" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#212a3b] mb-1">
                            {book?.title}
                        </h1>
                        <p className="text-[#3d485e] font-medium">by {book?.author}</p>
                    </div>

                    <div className="flex flex-wrap gap-3" role="status" aria-live="polite">
                        <div className="vapi-status-indicator">
                            <span className={`vapi-status-dot ${statusDisplay.color}`} aria-hidden="true" />
                            <span className="vapi-status-text">{statusDisplay.label}</span>
                        </div>

                        <div className="vapi-status-indicator">
                            <span className="vapi-status-text">Voice: {book?.persona || "Daniel"}</span>
                        </div>

                        <div className="vapi-status-indicator">
                            <span className="vapi-status-text">
                                {formatDuration(duration)}/{formatDuration(maxDurationSeconds)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="vapi-transcript-wrapper flex flex-col items-center">
                {!showTranscript ? (
                    <div className="flex flex-col items-center justify-center w-full min-h-[300px] py-10">
                        {isActive ? (
                            <div className="relative flex items-center justify-center w-40 h-40">
                                <div className={`absolute inset-0 rounded-full ${status === 'listening' ? 'bg-blue-400' : status === 'thinking' ? 'bg-purple-400' : 'bg-green-400'} opacity-30 animate-ping`} style={{ animationDuration: status === 'speaking' ? '1s' : '2s' }} />
                                <div className={`absolute inset-4 rounded-full ${status === 'listening' ? 'bg-blue-500' : status === 'thinking' ? 'bg-purple-500' : 'bg-green-500'} opacity-50 animate-pulse`} />
                                <div className={`absolute inset-8 rounded-full ${status === 'listening' ? 'bg-blue-600' : status === 'thinking' ? 'bg-purple-600' : 'bg-green-600'} opacity-80`} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                <MicOff className="size-16 opacity-30" />
                                <p className="text-lg">Click the mic above to start.</p>
                            </div>
                        )}
                        
                        <p className="mt-12 text-xl font-medium capitalize text-[#212a3b] tracking-wide">
                            {status === 'idle' ? '' : `${status}...`}
                        </p>
                    </div>
                ) : (
                    <div className="transcript-container min-h-[400px] w-full mt-2">
                        <Transcript
                            messages={messages}
                            currentMessage={currentMessage}
                            currentUserMessage={currentUserMessage}
                        />
                    </div>
                )}
                
                <button 
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="mt-4 mb-4 px-6 py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
                >
                    {showTranscript ? "Hide Conversation History" : "View Conversation History"}
                </button>
            </div>
        </div>
    );
};

export default VapiControls;
