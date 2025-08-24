"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";

interface ResumeUploadProps {
  setFiles: (file: File) => void;
}

function ResumeUpload({ setFiles }: ResumeUploadProps) {
  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      setFiles(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Your Resume</h3>
        <div className="text-sm text-gray-600">
          Upload your resume in PDF format. Our AI will analyze your experience to create personalized interview questions.
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto min-h-62 border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50/50 hover:bg-purple-50/30 rounded-xl transition-all duration-300">
        <FileUpload onChange={handleFileUpload} />
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Supported formats: PDF • Max size: 10MB
      </div>
    </div>
  )
}

export default ResumeUpload