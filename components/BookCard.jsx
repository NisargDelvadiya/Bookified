'use client';

import Link from "next/link";
import Image from "next/image";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBook } from "@/lib/actions/book.actions";

const BookCard = ({ _id, title, author, coverURL, slug }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!showConfirm) {
            setShowConfirm(true);
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
            {/* Delete button positioned prominently at the top right of the card */}
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title={showConfirm ? "Click again to permanently delete" : "Delete book"}
                aria-label={showConfirm ? "Confirm delete" : "Delete book"}
                className={`
                    absolute top-3 right-3 z-20
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                    text-xs font-semibold
                    shadow-lg backdrop-blur-md
                    transition-all duration-200 cursor-pointer
                    ${isDeleting
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : showConfirm
                        ? "bg-red-600 text-white scale-105 ring-2 ring-red-400"
                        : "bg-white/95 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                    }
                `}
            >
                {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                    {isDeleting ? "Deleting…" : showConfirm ? "Confirm?" : "Delete"}
                </span>
            </button>

            <Link href={`/books/${slug}`} className="block">
                <article className="book-card">
                    <figure className="book-card-figure">
                        <div className="book-card-cover-wrapper">
                            <Image
                                src={coverURL || "/images/book-placeholder.png"}
                                alt={title}
                                width={133}
                                height={200}
                                className="book-card-cover"
                            />
                        </div>

                        <figcaption className="book-card-meta">
                            <h3 className="book-card-title">{title}</h3>
                            <p className="book-card-author">{author}</p>
                        </figcaption>
                    </figure>
                </article>
            </Link>
        </div>
    );
};

export default BookCard;
