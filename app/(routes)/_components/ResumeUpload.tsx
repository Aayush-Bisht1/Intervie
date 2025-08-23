"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";

function ResumeUpload() {
    const [file, setFile] = useState<File []>([]);
    const handleFileUpload = (files: File[]) => {
        setFile(files);
        console.log(files);
    };
  return (
    <div className="mt-4 w-full max-w-4xl mx-auto min-h-96 border-2 border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
      <FileUpload onChange={handleFileUpload} />
    </div>
  )
}

export default ResumeUpload