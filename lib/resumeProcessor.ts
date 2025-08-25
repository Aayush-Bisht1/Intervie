import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Intervie",
    },
});

export interface ResumeData {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    skills?: string[];
    workExperience?: Array<{
        company: string;
        position: string;
        duration: string;
        description: string;
    }>;
    education?: Array<{
        institution: string;
        degree: string;
        field: string;
        year: string;
    }>;
    certifications?: string[];
    languages?: string[];
    projects?: Array<{
        name: string;
        description: string;
        technologies: string[];
    }>;
    jobTitle?: string;
    jobDescription?: string;
}

export async function processResumeWithAI(extractedText: string): Promise<ResumeData> {
    try {
        const completion = await openai.chat.completions.create({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
                {
                    role: "system",
                    content: `You are a professional resume analyzer. Extract and structure the following information from the resume. Return ONLY a valid JSON object with the following structure:
                    {
                        "name": "string",
                        "email": "string", 
                        "phone": "string",
                        "location": "string",
                        "summary": "string",
                        "skills": ["string"],
                        "workExperience": [{"company": "string", "position": "string", "duration": "string", "description": "string"}],
                        "education": [{"institution": "string", "degree": "string", "field": "string", "year": "string"}],
                        "certifications": ["string"],
                        "languages": ["string"],
                        "projects": [{"name": "string", "description": "string", "technologies": ["string"]}],
                        "jobTitle": "string",
                        "jobDescription": "string",
                    }
                    
                    If any field is not found in the resume or jd, set it to null or empty array. Ensure the response is valid JSON.`
                },
                {
                    role: "user",
                    content: `Please analyze this resume and extract the key information:\n\n${extractedText}`
                }
            ],
            temperature: 0.1,
            max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from AI service');
        }

        // Try to parse the JSON response
        try {
            const parsedData = JSON.parse(responseText);
            return parsedData as ResumeData;
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', responseText);
            throw new Error('Invalid response format from AI service');
        }

    } catch (error) {
        console.error('AI processing error:', error);
        throw error;
    }
}

export async function generateInterviewQuestions(resumeData: ResumeData): Promise<string[]> {
    try {
        const prompt = 
            `Based on this resume, generate 10 relevant interview questions where difficulty ranges from medium to hard. Resume: ${JSON.stringify(resumeData)}.If only jobTile and jobDescription is present in resume, then also generate relevant interview questions where difficulty ranges from medium to hard according to jobTile and jobDescription`;

        const completion = await openai.chat.completions.create({
            model: "qwen/qwen3-coder:free",
            messages: [
                {
                    role: "system",
                    content: "You are an expert Technical professional. Generate 10 relevant interview questions based on the provided resume. Return the questions as a JSON array of strings."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from AI service');
        }

        try {
            const questions = JSON.parse(responseText);
            return Array.isArray(questions) ? questions : [];
        } catch (parseError) {
            console.error('Failed to parse questions response:', responseText);
            throw new Error('Invalid response format from AI service');
        }

    } catch (error) {
        console.error('Question generation error:', error);
        throw error;
    }
}

export function validateResumeData(data: any): data is ResumeData {
    return (
        typeof data === 'object' &&
        data !== null &&
        (typeof data.name === 'string' || data.name === null) &&
        (typeof data.email === 'string' || data.email === null) &&
        (Array.isArray(data.skills) || data.skills === null)
    );
}
