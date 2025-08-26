import OpenAI from "openai";

let openai: OpenAI | null = null;

const getOpenAIClient = () => {
    if (!openai) {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key not configured');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
                "X-Title": "Intervie",
            },
        });
    }
    return openai;
};

// Single function to generate interview questions from text
export async function generateInterviewQuestions(extractedText: string): Promise<string[]> {
    try {
        if (!extractedText || extractedText.trim().length === 0) {
            return getFallbackQuestions();
        }

        const client = getOpenAIClient();

        // Retry logic for rate limiting
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const completion = await client.chat.completions.create({
                    model: "deepseek/deepseek-r1-0528:free",
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert technical interviewer. Generate exactly 10 relevant interview questions based on the provided resume or job description text.

CRITICAL: Respond with ONLY a JSON array of 10 questions. No explanations, no markdown, no additional text.

Format: ["Question 1?", "Question 2?", "Question 3?", ...]

Rules:
- Questions should be medium to hard difficulty
- Make them specific to skills, experience, and role mentioned in the text
- Include both technical and behavioral questions
- Ensure each question ends with a question mark
- Return exactly 10 questions`
                        },
                        {
                            role: "user",
                            content: `Generate 10 interview questions based on this text:\n\n${extractedText.substring(0, 4000)}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1500,
                });

                const responseText = completion.choices[0]?.message?.content;
                if (!responseText) {
                    throw new Error('No response from AI service');
                }

                console.log('AI Response:', responseText);

                // Parse the response
                const questions = extractQuestionsFromResponse(responseText);

                if (questions.length > 0) {
                    return questions.slice(0, 10); // Ensure exactly 10 questions
                } else {
                    throw new Error('No valid questions found in response');
                }

            } catch (error: any) {
                lastError = error;
                console.error(`API call attempt ${attempt} failed:`, error);

                if (error.status === 429 && attempt < 3) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Rate limited. Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                break;
            }
        }

        console.error('All API attempts failed, using fallback questions');
        return getFallbackQuestions();

    } catch (error) {
        console.error('Question generation error:', error);
        return getFallbackQuestions();
    }
}

// Extract questions from AI response (handles various formats)
function extractQuestionsFromResponse(responseText: string): string[] {
    try {
        // Try parsing as JSON array first
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) {
            return parsed.map(q => String(q).trim()).filter(q => q.length > 5);
        }
    } catch (e) {
        console.log('Direct JSON parse failed, trying other methods...');
    }

    // Try extracting from code blocks
    const codeBlockMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/i);
    if (codeBlockMatch) {
        try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (Array.isArray(parsed)) {
                return parsed.map(q => String(q).trim()).filter(q => q.length > 5);
            }
        } catch (e) { }
    }

    // Try finding JSON array in text
    const arrayMatch = responseText.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
        try {
            const parsed = JSON.parse(arrayMatch[0]);
            if (Array.isArray(parsed)) {
                return parsed.map(q => String(q).trim()).filter(q => q.length > 5);
            }
        } catch (e) { }
    }

    // Fallback: extract questions from plain text
    return extractQuestionsFromPlainText(responseText);
}

// Extract questions from plain text response
function extractQuestionsFromPlainText(text: string): string[] {
    const questions: string[] = [];

    // Try numbered questions (1., 2., 1), 2), etc.)
    const numberedPattern = /^\s*\d+[\.\)]\s*(.+\?)$/gm;
    let match;

    while ((match = numberedPattern.exec(text)) !== null) {
        const question = match[1].trim();
        if (question.length > 10) {
            questions.push(question);
        }
    }

    // If no numbered questions, try sentences ending with ?
    if (questions.length === 0) {
        const questionPattern = /([^.!?\n]*\?)/g;
        while ((match = questionPattern.exec(text)) !== null) {
            const question = match[1].trim();
            if (question.length > 15 && !question.toLowerCase().includes('question')) {
                questions.push(question);
            }
        }
    }

    return questions.slice(0, 10);
}

// Fallback questions when AI fails
function getFallbackQuestions(): string[] {
    return [
        "Tell me about yourself and your professional background.",
        "What are your greatest strengths and how do they apply to this role?",
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "How do you stay updated with the latest technologies and industry trends?",
        "What motivates you in your work and career?",
        "Describe a time when you had to work with a difficult team member.",
        "How do you approach problem-solving in complex situations?",
        "What are your long-term career goals?",
        "Why are you interested in this position and our company?",
        "Do you have any questions for us about the role or company?"
    ];
}