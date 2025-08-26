import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
// import pdf from 'pdf-parse';
import { generateInterviewQuestions } from "@/lib/resumeProcessor";
import { handleCorsOptions, withCorsJson } from "@/lib/cors";

var imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!
});

export async function OPTIONS(req: NextRequest) {
    return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jd = {
        jobtitle: formData.get('jobTitle'),
        jobdescription: formData.get('jobDescription'),
    };
    if (!file && !jd.jobdescription && !jd.jobtitle) {
        return withCorsJson(req, { error: 'No file  && JD is uploaded' }, { status: 400 });
    }
    let imagekitUrl = '';
    let extractedText = '';
    let interviewQuestions: string[] = [];
    if (file) {
        try {
            if (file.type !== 'application/pdf') {
                return withCorsJson(req, { 
                    error: 'Invalid file type. Please upload a PDF file.' 
                }, { status: 400 });
            }
            if (file.size > 10 * 1024 * 1024) {
                return withCorsJson(req, { 
                    error: 'File too large. Please upload a PDF smaller than 10MB.' 
                }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const upload = await imagekit.upload({
                file: buffer,
                fileName: Date.now().toString() + '.pdf',
                folder: "/intervie/",
                isPublished: true,
                useUniqueFileName: true
            });
            imagekitUrl = upload.url;
            try {
                const pdfParse = require('pdf-parse/lib/pdf-parse');
                const pdfData = await pdfParse(buffer);
                extractedText = pdfData.text;
                console.log(extractedText.length);
            } catch (error) {
                return withCorsJson(req, { error: 'Failed to extract text from pdf file' }, { status: 500 })
            }
            if (!extractedText.trim()) {
                return withCorsJson(req, { error: 'No text content found in PDF' }, { status: 400 });
            }
            try {
                interviewQuestions = await generateInterviewQuestions(extractedText);
            } catch (aiError) {
                return withCorsJson(req, { aiError: 'Failed to generate Interview Questions' }, { status: 500 });
            }
            return withCorsJson(req, {
                success: true,
                message: 'resume uploaded,extracted,processed and generated questions',
                interviewQuestions,
                resumeUrl: imagekitUrl,
            }, { status: 200 })
        } catch (error) {
            return withCorsJson(req, { error: 'Error generating questions from resume file' }, { status: 500 });
        }
    }
    if (jd.jobdescription && jd.jobtitle) {
        try {
            extractedText = `Job Title: ${jd.jobtitle}\n\nJob Description: ${jd.jobdescription}`;
            try {
                interviewQuestions = await generateInterviewQuestions(extractedText);
            } catch (aiError) {
                return withCorsJson(req, { aiError: 'Failed to generate Interview Questions' }, { status: 500 });
            }
            return withCorsJson(req, {
                success: true,
                message: 'job title and description- extracted,processed and generated questions',
                interviewQuestions,
                jobTitle: jd.jobtitle,
                JobDescription: jd.jobdescription
            }, { status: 200 })
        } catch (error) {
            return withCorsJson(req, { error: 'Error generating questions from Job Title and Description' }, { status: 500 });
        }
    }
}