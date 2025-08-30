import { handleCorsOptions, withCorsJson } from '@/lib/cors';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function OPTIONS(req: NextRequest) {
    return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
    try {
        const { transcript, interviewQuestions, interviewId } = await req.json();

        if (!transcript || !interviewQuestions) {
            return withCorsJson(req, { error: 'Missing transcript or interview questions' },
                { status: 400 })
        }

        // Create a comprehensive prompt for feedback generation
        const prompt = `
You are an expert interview evaluator. Analyze the following interview transcript and provide detailed feedback.

INTERVIEW QUESTIONS:
${interviewQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

TRANSCRIPT:
${transcript}

Please provide a comprehensive evaluation in the following JSON format:
{
  "Score": [number from 1-10],
  "strengths": [array of candidate's key strengths],
  "weaknesses": [array of areas for improvement],
  "recommendations": [array of actionable recommendations]
}

Evaluation Criteria:
- Technical competency (based on answers to technical questions)
- Cultural fit (enthusiasm, values alignment, team compatibility)
- Problem-solving approach
- Experience relevance

Provide constructive, specific feedback that helps the candidate improve while highlighting their positive attributes.
`;

        // Generate feedback using OpenAI
        const completion = await openai.chat.completions.create({
            model: "tngtech/deepseek-r1t2-chimera:free", 
            messages: [
                {
                    role: "system",
                    content: "You are an expert interview evaluator who provides detailed, constructive feedback on job interviews. Always respond with valid JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2000
        });

        const feedbackText = completion.choices[0].message.content;

        if (!feedbackText) {
            throw new Error('No feedback generated');
        }

        // Parse the JSON response
        let feedback;
        try {
            feedback = JSON.parse(feedbackText);
        } catch (parseError) {
            console.error('Error parsing feedback JSON:', parseError);
            // Fallback feedback structure
            feedback = {
                Score: 7,
                strengths: ["Professional communication"],
                weaknesses: ["Could provide more detailed examples"],
                recommendations: ["Practice providing specific examples", "Work on confidence"],
            };
        }

        return withCorsJson(req,{
            success: true,
            feedback: feedback
        });

    } catch (error) {
        console.error('Error generating feedback:', error);
        return withCorsJson(req,
            { error: 'Failed to generate feedback' },
            { status: 500 }
        );
    }
}