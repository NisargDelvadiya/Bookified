import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { MAX_FILE_SIZE } from "@/lib/constants";

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized: User not authenticated" }, { status: 401 });
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.bookified_READ_WRITE_TOKEN;

        if (!token) {
            console.error("BLOB_READ_WRITE_TOKEN is missing in environment variables!");
            return NextResponse.json(
                { error: "BLOB_READ_WRITE_TOKEN is not configured on the server. Please add it to your environment variables." },
                { status: 500 }
            );
        }

        const contentType = request.headers.get("content-type") || "";

        // Direct FormData upload (CORS-free and reliable across all domains)
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const file = formData.get("file") as File | null;
            const filename = (formData.get("filename") as string) || file?.name || "file.pdf";

            if (!file) {
                return NextResponse.json({ error: "No file provided" }, { status: 400 });
            }

            const blob = await put(filename, file, {
                access: "public",
                token,
            });

            return NextResponse.json(blob);
        }

        // Fallback for client-side handleUpload
        const body = (await request.json()) as HandleUploadBody;
        const jsonResponse = await handleUpload({
            token,
            body,
            request,
            onBeforeGenerateToken: async () => {
                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                    addRandomSuffix: true,
                    maximumSizeInBytes: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({ userId })
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log('File uploaded to blob: ', blob.url, tokenPayload);
            }
        });

        return NextResponse.json(jsonResponse);
    } catch (e) {
        const message = e instanceof Error ? e.message : "An unknown error occurred";
        const status = message.includes('Unauthorized') ? 401 : 500;
        console.error('Upload error:', e);
        return NextResponse.json({ error: message || 'Upload failed' }, { status });
    }
}
