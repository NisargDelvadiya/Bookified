import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions";
import VapiControls from "@/components/VapiControls";

export default async function BookDetailsPage({ params }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const result = await getBookBySlug(slug);

  if (!result?.success || !result?.data) {
    redirect("/");
  }

  const book = result.data;

  return (
    <div className="book-page-container">
      <Link href="/" className="back-btn-floating">
        <ArrowLeft className="size-6 text-[#212a3b]" />
      </Link>

      <VapiControls book={book} />
    </div>
  );
}
