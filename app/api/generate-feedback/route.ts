import { handleCorsOptions, withCorsJson } from '@/lib/cors';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define interfaces for better type safety
interface RequestBody {
    transcript: string;
    interviewQuestions: string[];
    interviewId?: string;
    questionsAttempted?: number;
    totalQuestions?: number;
}

interface FeedbackResponse {
    Score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
}

interface MetricsResponse {
    questionsAttempted: number;
    totalQuestions: number;
    completionRate: string;
    responseQualityRate: string;
    avgResponseLength: string;
}

interface SuccessResponse {
    success: true;
    feedback: FeedbackResponse;
    metrics: MetricsResponse;
}

interface ErrorResponse {
    error: string;
    details?: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Intervie",
    },
});

export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
    return handleCorsOptions(req);
}

export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
    try {
        const body: RequestBody = await req.json();
        const { transcript, interviewQuestions, interviewId, questionsAttempted, totalQuestions } = body;

        if (!transcript || !interviewQuestions) {
            return withCorsJson(req, { error: 'Missing transcript or interview questions' }, { status: 400 });
        }

        // Analyze transcript to get better metrics
        const transcriptLines = transcript.split('\n').filter((line: string) => line.trim());
        const candidateResponses = transcriptLines
            .filter((line: string) => line.startsWith('Candidate:'))
            .map((line: string) => line.replace('Candidate:', '').trim());
        const interviewerQuestions = transcriptLines
            .filter((line: string) => line.startsWith('Interviewer:'))
            .map((line: string) => line.replace('Interviewer:', '').trim());

        // Calculate completion metrics
        const actualQuestionsAttempted = questionsAttempted || candidateResponses.length;
        const totalQuestionsCount = totalQuestions || interviewQuestions.length;
        const completionRate = totalQuestionsCount > 0 ? (actualQuestionsAttempted / totalQuestionsCount) * 100 : 0;

        // Calculate response quality metrics
        const avgResponseLength = candidateResponses.length > 0 
            ? candidateResponses.reduce((acc: number, response: string) => acc + response.length, 0) / candidateResponses.length 
            : 0;
        const hasDetailedResponses = candidateResponses.filter((response: string) => response.length > 50).length;
        const responseQualityRate = candidateResponses.length > 0 ? (hasDetailedResponses / candidateResponses.length) * 100 : 0;

        console.log('Interview Metrics:', {
            actualQuestionsAttempted,
            totalQuestionsCount,
            completionRate,
            avgResponseLength,
            responseQualityRate,
            candidateResponseCount: candidateResponses.length
        });

        // Create a more detailed prompt for feedback generation
        const prompt = `
You are an expert technical interview evaluator specializing in software engineering positions. Analyze this interview transcript and provide detailed feedback.

INTERVIEW METRICS:
- Questions Attempted: ${actualQuestionsAttempted}/${totalQuestionsCount} (${completionRate.toFixed(1)}% completion)
- Average Response Length: ${avgResponseLength.toFixed(0)} characters
- Detailed Responses: ${hasDetailedResponses}/${candidateResponses.length} responses
- Response Quality Rate: ${responseQualityRate.toFixed(1)}%

INTERVIEW QUESTIONS:
${interviewQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

INTERVIEW TRANSCRIPT:
${transcript}

CANDIDATE RESPONSES ANALYSIS:
${candidateResponses.map((response: string, i: number) => `Response ${i + 1}: ${response}`).join('\n\n')}

Based on this analysis, provide feedback in EXACTLY this JSON format (no additional text or explanation):
{
  "Score": [number from 1-10 based on completion rate, response quality, technical accuracy, and communication skills],
  "strengths": [array of 2-4 specific strengths with examples from their responses],
  "weaknesses": [array of 2-4 areas for improvement with specific examples],
  "recommendations": [array of 3-5 actionable recommendations for improvement]
}

SCORING GUIDELINES:
- 9-10: Exceptional performance, completed most/all questions with excellent technical depth and communication
- 7-8: Strong performance, good completion rate with solid technical answers
- 5-6: Average performance, moderate completion with some good answers but lacks depth
- 3-4: Below average, low completion rate or weak technical responses
- 1-2: Poor performance, very low completion or inadequate responses

Focus on:
1. Interview completion rate (${completionRate.toFixed(1)}%)
2. Technical accuracy and depth of answers
3. Communication clarity and structure
4. Specific examples from their responses
5. Problem-solving approach demonstrated

Return ONLY the JSON object, no other text.`;

        // Generate feedback using OpenAI with better parameters
        const completion = await openai.chat.completions.create({
            model: "google/gemini-flash-1.5",
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical interview evaluator. You MUST respond with valid JSON only, no additional text or formatting. Be specific and constructive in your feedback."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 1500,
        });

        let feedbackText = completion.choices[0]?.message?.content?.trim();

        if (!feedbackText) {
            throw new Error('No feedback generated from LLM');
        }

        console.log('Raw LLM Response:', feedbackText);

        // Clean up the response - remove any markdown formatting or extra text
        feedbackText = feedbackText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Try to extract JSON if it's wrapped in other text
        const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            feedbackText = jsonMatch[0];
        }

        // Parse the JSON response
        let feedback: FeedbackResponse;
        try {
            const parsedFeedback = JSON.parse(feedbackText) as Partial<FeedbackResponse>;

            // Validate the required fields
            if (!parsedFeedback.Score || !Array.isArray(parsedFeedback.strengths) || !Array.isArray(parsedFeedback.weaknesses) || !Array.isArray(parsedFeedback.recommendations)) {
                throw new Error('Invalid feedback structure');
            }

            // Ensure score is within valid range
            feedback = {
                Score: Math.max(1, Math.min(10, parsedFeedback.Score)),
                strengths: parsedFeedback.strengths,
                weaknesses: parsedFeedback.weaknesses,
                recommendations: parsedFeedback.recommendations
            };

        } catch (parseError) {
            console.error('Error parsing feedback JSON:', parseError);
            console.error('Failed to parse text:', feedbackText);

            // Create intelligent fallback based on actual metrics
            const baseScore = Math.max(1, Math.min(10,
                Math.round((completionRate / 100) * 6 + (responseQualityRate / 100) * 4)
            ));

            const fallbackStrengths: string[] = [];
            const fallbackWeaknesses: string[] = [];

            if (actualQuestionsAttempted > 0) {
                fallbackStrengths.push("Participated actively in the interview process");
            } else {
                fallbackStrengths.push("Showed up for the interview");
            }

            if (avgResponseLength > 100) {
                fallbackStrengths.push("Provided detailed responses to questions");
            } else {
                fallbackStrengths.push("Attempted to answer questions");
            }

            if (completionRate > 70) {
                fallbackStrengths.push("Completed majority of interview questions");
            } else {
                fallbackStrengths.push("Engaged with the interview process");
            }

            if (completionRate < 100) {
                fallbackWeaknesses.push(`Interview completion rate could be improved (${completionRate.toFixed(1)}%)`);
            }

            if (avgResponseLength < 50) {
                fallbackWeaknesses.push("Responses could be more detailed and comprehensive");
            }

            if (responseQualityRate < 50) {
                fallbackWeaknesses.push("Could provide more specific examples and technical details");
            }

            if (actualQuestionsAttempted < totalQuestionsCount) {
                fallbackWeaknesses.push("Could attempt to answer all interview questions");
            }

            const fallbackRecommendations: string[] = [
                "Practice providing detailed examples from your experience",
                "Research common interview questions for your target role",
                "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions"
            ];

            if (completionRate < 100) {
                fallbackRecommendations.unshift("Focus on completing all interview questions during the session");
            } else {
                fallbackRecommendations.push("Continue maintaining good interview completion");
            }

            if (avgResponseLength < 100) {
                fallbackRecommendations.splice(1, 0, "Elaborate more on your answers with specific details");
            } else {
                fallbackRecommendations.push("Keep providing comprehensive responses");
            }

            feedback = {
                Score: baseScore,
                strengths: fallbackStrengths,
                weaknesses: fallbackWeaknesses,
                recommendations: fallbackRecommendations
            };
        }

        console.log('Final feedback:', feedback);

        const successResponse: SuccessResponse = {
            success: true,
            feedback: feedback,
            metrics: {
                questionsAttempted: actualQuestionsAttempted,
                totalQuestions: totalQuestionsCount,
                completionRate: completionRate.toFixed(1),
                responseQualityRate: responseQualityRate.toFixed(1),
                avgResponseLength: avgResponseLength.toFixed(0)
            }
        };

        return withCorsJson(req, successResponse);

    } catch (error) {
        console.error('Error generating feedback:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        const errorResponse: ErrorResponse = {
            error: 'Failed to generate feedback',
            details: errorMessage
        };

        return withCorsJson(req, errorResponse, { status: 500 });
    }
}