import { getUserVoiceSessions } from "@/lib/actions/session.actions";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

export const metadata = {
    title: 'Chat History | Bookified',
    description: 'View your past AI conversations',
};

export default async function HistoryPage() {
    const { success, data: sessions, error } = await getUserVoiceSessions();

    if (!success) {
        return (
            <div className="wrapper py-24 min-h-[70vh] flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading history</h1>
                <p className="text-[#3d485e]">{error || "Please try again later."}</p>
            </div>
        );
    }

    // Filter out sessions that have no transcript
    const validSessions = sessions.filter(s => s.transcript && s.transcript.length > 0);

    return (
        <main className="wrapper py-12 min-h-screen">
            <div className="max-w-4xl mx-auto mt-20">
                <h1 className="text-3xl font-bold text-[#212a3b] mb-2">Conversation History</h1>
                <p className="text-[#3d485e] mb-10 text-lg">Review your past discussions with the AI across all your books.</p>
                
                {validSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="text-5xl mb-4">💬</div>
                        <h2 className="text-xl font-bold text-[#212a3b] mb-2">No history yet</h2>
                        <p className="text-[#3d485e] mb-6">Start a conversation on any book to see it saved here.</p>
                        <Link href="/" className="inline-block bg-[#212a3b] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#3d485e] transition-colors shadow-md">
                            Explore Library
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {validSessions.map((session) => (
                            <div key={session._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gray-50 border-b border-gray-100 p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {session.bookId?.coverURL ? (
                                            <div className="w-10 h-14 rounded overflow-hidden relative shadow-sm">
                                                <Image src={session.bookId.coverURL} alt="Cover" fill className="object-cover" sizes="40px" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-14 bg-gray-200 rounded shadow-sm"></div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-[#212a3b] text-lg">{session.bookId?.title || "Unknown Book"}</h3>
                                            <p className="text-sm text-[#3d485e]">
                                                {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })} • {Math.round(session.durationSeconds / 60)} min
                                            </p>
                                        </div>
                                    </div>
                                    {session.bookId && (
                                        <Link 
                                            href={`/books/${session.bookId.slug}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-4 py-2 rounded-lg"
                                        >
                                            View Book
                                        </Link>
                                    )}
                                </div>

                                {/* Transcript */}
                                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                                    {session.transcript.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-4 ${
                                                msg.role === 'user' 
                                                    ? 'bg-blue-600 text-white rounded-br-sm' 
                                                    : 'bg-gray-100 text-[#212a3b] rounded-bl-sm'
                                            }`}>
                                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
