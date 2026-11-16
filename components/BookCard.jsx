'use client';

import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBook } from "@/lib/actions/book.actions";

const BookCard = ({ _id, title, author, coverURL, slug, clerkId, currentUserId }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const isOwner = currentUserId && clerkId && currentUserId === clerkId;

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!showConfirm) {
            setShowConfirm(true);
            // Auto-dismiss confirm after 3s
            setTimeout(() => setShowConfirm(false), 3000);
            return;
        }

        setIsDeleting(true);
        setShowConfirm(false);

        const result = await deleteBook(_id);

        if (result.success) {
            toast.success(`"${title}" deleted successfully.`);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete book.");
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative group">
            <Link href={`/books/${slug}`}>
                <article className="book-card">
                    <figure className="book-card-figure">
                        <div className="book-card-cover-wrapper">
                            <Image src={coverURL} alt={title} width={133} height={200} className="book-card-cover" />
                        </div>

                        <figcaption className="book-card-meta">
                            <h3 className="book-card-title">{title}</h3>
                            <p className="book-card-author">{author}</p>
                        </figcaption>
                    </figure>
                </article>
            </Link>

            {isOwner && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title={showConfirm ? "Click again to confirm delete" : "Delete book"}
                    aria-label={showConfirm ? "Confirm delete" : "Delete book"}
                    className={`
                        absolute top-2 right-2 z-10
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        text-xs font-semibold
                        shadow-md backdrop-blur-sm
                        transition-all duration-200 cursor-pointer
                        opacity-0 group-hover:opacity-100
                        ${isDeleting
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : showConfirm
                            ? "bg-red-600 text-white scale-105"
                            : "bg-white/90 text-red-500 hover:bg-red-600 hover:text-white"
                        }
                    `}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                        {isDeleting ? "Deleting…" : showConfirm ? "Confirm?" : "Delete"}
                    </span>
                </button>
            )}
        </div>
    );
};

export default BookCard;
