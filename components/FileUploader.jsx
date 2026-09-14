'use client';

import React, { useCallback, useRef } from 'react';
import { useController } from 'react-hook-form';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const FileUploader = ({
    control,
    name,
    label,
    acceptTypes = [],
    disabled,
    icon: Icon,
    placeholder,
    hint,
}) => {
    const {
        field: { onChange, value },
    } = useController({ name, control });

    const inputRef = useRef(null);

    const handleFileChange = useCallback(
        (e) => {
            const file = e.target.files?.[0];
            if (file) {
                onChange(file);
            }
        },
        [onChange]
    );

    const onRemove = useCallback(
        (e) => {
            e.stopPropagation();
            onChange(null);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [onChange]
    );

    const isUploaded = !!value;

    return (
        <FormItem className="w-full">
            <FormLabel className="form-label">{label}</FormLabel>
            <FormControl>
                <div
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={`${label}: ${placeholder}`}
                    className={cn(
                        'upload-dropzone border-2 border-dashed border-[#8B7355]/20 focus-visible:ring-2 focus-visible:ring-[#212a3b] focus-visible:outline-none',
                        isUploaded && 'upload-dropzone-uploaded'
                    )}
                    onClick={() => !disabled && inputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                >
                    <input
                        type="file"
                        accept={acceptTypes.join(',')}
                        className="hidden"
                        ref={inputRef}
                        onChange={handleFileChange}
                        disabled={disabled}
                        aria-hidden="true"
                    />

                    {isUploaded ? (
                        <div className="flex flex-col items-center relative w-full px-4">
                            <p className="upload-dropzone-text line-clamp-1">{value?.name}</p>
                            <button
                                type="button"
                                onClick={onRemove}
                                aria-label={`Remove uploaded file ${value?.name || ''}`}
                                className="upload-dropzone-remove mt-2 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {Icon && <Icon className="upload-dropzone-icon" />}
                            <p className="upload-dropzone-text">{placeholder}</p>
                            <p className="upload-dropzone-hint">{hint}</p>
                        </>
                    )}
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
};

export default FileUploader;
