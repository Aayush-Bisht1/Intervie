"use client";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

interface FileUploadProps {
  onChange?: (files: File[]) => void;
}

export const FileUpload = ({ onChange }: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: {
      'application/pdf': ['.pdf']
      },
    onDrop: handleFileChange,
    onError: (err) => {
      console.log(err);
    },
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange && onChange(newFiles);
  };

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-10">
          <div className="relative w-full max-w-xl mx-auto">
            {files.length > 0 && (
              <motion.div
                key="file-upload"
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative overflow-hidden z-40 bg-white flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md shadow-sm border border-gray-200"
                )}
              >
                <div className="flex justify-between w-full items-center gap-4">
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-neutral-700 truncate text-sm">
                      {files[0].name}
                    </span>
                  </motion.div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(0);
                    }}
                    className="h-6 w-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3 text-gray-600 hover:text-red-600" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(files[0].size / 1024 / 1024).toFixed(2)} MB
                </div>
              </motion.div>
            )}
            
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={secondaryVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md shadow-[0px_10px_50px_rgba(0,0,0,0.1)] border border-gray-200",
                  "group-hover/file:border-purple-300 transition-all duration-300"
                )}
              >
                <Upload className="h-4 w-4 text-purple-600" />
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-purple-300 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>

          <div className="relative z-40 mt-4 text-center">
            <div className="font-sans font-bold text-neutral-700 text-base">
              {files.length > 0 ? "File uploaded successfully!" : "Upload your resume"}
            </div>
            <div className="font-sans font-normal text-neutral-400 text-sm mt-2">
              {files.length > 0 
                ? "Click to upload a different file" 
                : isDragActive 
                ? "Drop your file here" 
                : "Drag and drop or click to browse"}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};