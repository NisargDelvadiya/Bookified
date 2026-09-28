'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Copy, Check, Flag } from 'lucide-react';

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

const Transcript = ({ messages = [], currentMessage = '', currentUserMessage = '' }) => {
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  if (isEmpty) {
    return (
      <div className="transcript-empty">
        <Mic className="size-12 text-[#212a3b] mb-4" />
        <h2 className="transcript-empty-text"><b>No conversation yet</b></h2>
        <p className="transcript-empty-hint">
          Click the mic button above to start talking
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-label="Conversation transcript"
      aria-live="polite"
      className="transcript-messages overflow-y-auto pr-2 flex-1"
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={`transcript-message group flex flex-col gap-1 ${
            message.role === 'user' ? 'transcript-message-user' : 'transcript-message-assistant'
          }`}
        >
          <div
            className={`transcript-bubble ${
              message.role === 'user' ? 'transcript-bubble-user' : 'transcript-bubble-assistant'
            }`}
          >
            {message.content}
          </div>
          
          {/* Actions (only visible on hover) */}
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <CopyButton text={message.content} />
            
            {message.role === 'assistant' && (
              <button 
                className="p-1 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-medium"
                title="Report issue"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {/* User Streaming Message */}
      {currentUserMessage && (
        <div className="transcript-message transcript-message-user">
          <div className="transcript-bubble transcript-bubble-user">
            {currentUserMessage}
            <span className="transcript-cursor" />
          </div>
        </div>
      )}

      {/* Assistant Streaming Message */}
      {currentMessage && (
        <div className="transcript-message transcript-message-assistant">
          <div className="transcript-bubble transcript-bubble-assistant">
            {currentMessage}
            <span className="transcript-cursor" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Transcript;
