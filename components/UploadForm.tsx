'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, ImageIcon } from 'lucide-react';
import { UploadSchema } from '@/lib/zod';
import { BookUploadFormValues } from '@/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ACCEPTED_PDF_TYPES, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import FileUploader from './FileUploader';
import VoiceSelector from './VoiceSelector';
import LoadingOverlay from './LoadingOverlay';
import { useAuth } from "@clerk/nextjs";
import { toast } from 'sonner';
import {checkBookExists, createBook, saveBookSegments} from "@/lib/actions/book.actions";
import {useRouter} from "next/navigation";
async function uploadFileToServer(file: File | Blob, filename: string): Promise<{ url: string; pathname: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file to storage');
    }

    return result;
}

const UploadForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { userId } = useAuth();
    const router = useRouter()

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            persona: '',
            pdfFile: undefined,
            coverImage: undefined,
        },
    });

    const onSubmit = async (data: BookUploadFormValues) => {
        if(!userId) {
           return toast.error("Please login to upload books");
        }

        setIsSubmitting(true);

        try {
            console.log("Step 1: Checking if book exists...");
            const existsCheck = await checkBookExists(data.title);

            if(existsCheck.exists && existsCheck.book) {
                toast.info("Book with same title already exists.");
                form.reset()
                router.push(`/books/${existsCheck.book.slug}`)
                return;
            }

            const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase();
            const pdfFile = data.pdfFile;

            console.log("Step 2: Parsing PDF pages...");
            const parsedPDF = await parsePDFFile(pdfFile);
            console.log(`Parsed ${parsedPDF.content.length} segments from PDF.`);

            if(parsedPDF.content.length === 0) {
                toast.error("Failed to parse PDF. Please try again with a different file.");
                return;
            }

            console.log("Step 3: Uploading PDF to Storage...");
            const uploadedPdfBlob = await uploadFileToServer(pdfFile, `${fileTitle}.pdf`);
            console.log("PDF uploaded:", uploadedPdfBlob.url);

            let coverUrl: string;

            if(data.coverImage) {
                console.log("Uploading custom cover...");
                const coverFile = data.coverImage;
                const uploadedCoverBlob = await uploadFileToServer(coverFile, `${fileTitle}_cover.png`);
                coverUrl = uploadedCoverBlob.url;
            } else {
                console.log("Uploading auto-generated cover...");
                const response = await fetch(parsedPDF.cover);
                const blob = await response.blob();

                const uploadedCoverBlob = await uploadFileToServer(blob, `${fileTitle}_cover.png`);
                coverUrl = uploadedCoverBlob.url;
            }

            console.log("Step 4: Creating Book in database...");
            const book = await createBook({
                clerkId: userId,
                title: data.title,
                author: data.author,
                persona: data.persona,
                fileURL: uploadedPdfBlob.url,
                fileBlobKey: uploadedPdfBlob.pathname,
                coverURL: coverUrl,
                fileSize: pdfFile.size,
            });

            if(!book.success) {
                toast.error(book.error as string || "Failed to create book");
                if (book.isBillingError) {
                    router.push("/subscriptions");
                }
                return;
            }

            if(book.alreadyExists) {
                toast.info("Book with same title already exists.");
                form.reset()
                router.push(`/books/${book.data.slug}`)
                return;
            }

            console.log("Step 5: Saving text segments to database...");
            const segments = await saveBookSegments(book.data._id, userId, parsedPDF.content);

            if(!segments.success) {
                toast.error("Failed to save book segments");
                throw new Error("Failed to save book segments");
            }

            console.log("Upload & synthesis complete!");
            form.reset();
            router.push('/');
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : "Failed to upload book. Please try again later.";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <>
            {isSubmitting && <LoadingOverlay />}

            <div className="new-book-wrapper">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* 1. PDF File Upload */}
                        <FileUploader
                            control={form.control}
                            name="pdfFile"
                            label="Book PDF File"
                            acceptTypes={ACCEPTED_PDF_TYPES}
                            icon={Upload}
                            placeholder="Click to upload PDF"
                            hint="PDF file (max 50MB)"
                            disabled={isSubmitting}
                        />

                        {/* 2. Cover Image Upload */}
                        <FileUploader
                            control={form.control}
                            name="coverImage"
                            label="Cover Image (Optional)"
                            acceptTypes={ACCEPTED_IMAGE_TYPES}
                            icon={ImageIcon}
                            placeholder="Click to upload cover image"
                            hint="Leave empty to auto-generate from PDF"
                            disabled={isSubmitting}
                        />

                        {/* 3. Title Input */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="form-input"
                                            placeholder="ex: Rich Dad Poor Dad"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 4. Author Input */}
                        <FormField
                            control={form.control}
                            name="author"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Author Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="form-input"
                                            placeholder="ex: Robert Kiyosaki"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 5. Voice Selector */}
                        <FormField
                            control={form.control}
                            name="persona"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="form-label">Choose Assistant Voice</FormLabel>
                                    <FormControl>
                                        <VoiceSelector
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* 6. Submit Button */}
                        <Button type="submit" className="form-btn" disabled={isSubmitting}>
                            Begin Synthesis
                        </Button>
                    </form>
                </Form>
            </div>
        </>
    );
};

export default UploadForm;
