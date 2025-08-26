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

// Helper function to handle API calls with retry logic
async function callOpenAIWithRetry(client: OpenAI, params: any, maxRetries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await client.chat.completions.create(params);
        } catch (error: any) {
            console.error(`API call attempt ${attempt} failed:`, error);
            
            if (error.status === 429) {
                if (attempt === maxRetries) {
                    throw new Error('Rate limit exceeded. Please try again in a few minutes.');
                }
                // Wait before retrying (exponential backoff)
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Rate limited. Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            throw error;
        }
    }
}

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

// Function to extract JSON from AI response that might contain markdown or extra text
function extractJSONFromResponse(responseText: string): any {
    try {
        // First, try to parse as-is
        return JSON.parse(responseText);
    } catch (error) {
        console.log('Direct JSON parse failed, trying to extract JSON from response...');
        
        // Try to extract JSON from markdown code blocks
        const jsonBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i;
        const match = responseText.match(jsonBlockRegex);
        
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (parseError) {
                console.log('Failed to parse JSON from code block');
            }
        }

        // Try to find JSON object in the response (between first { and last })
        const startIdx = responseText.indexOf('{');
        const lastIdx = responseText.lastIndexOf('}');
        
        if (startIdx !== -1 && lastIdx !== -1 && lastIdx > startIdx) {
            const potentialJson = responseText.substring(startIdx, lastIdx + 1);
            try {
                return JSON.parse(potentialJson);
            } catch (parseError) {
                console.log('Failed to parse extracted JSON substring');
            }
        }

        // If all else fails, try to clean the response
        let cleanedResponse = responseText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .replace(/^\s*[\w\s]*?({[\s\S]*})\s*[\w\s]*?$/m, '$1')
            .trim();

        return JSON.parse(cleanedResponse);
    }
}

// Function to create default resume structure
function createDefaultResumeData(): ResumeData {
    return {
        name: undefined,
        email: undefined,
        phone: undefined,
        location: undefined,
        summary: undefined,
        skills: [],
        workExperience: [],
        education: [],
        certifications: [],
        languages: [],
        projects: [],
        jobTitle: undefined,
        jobDescription: undefined
    };
}

export async function processResumeWithAI(extractedText: string): Promise<ResumeData> {
    try {
        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text provided for analysis');
        }

        const client = getOpenAIClient();
        const completion = await callOpenAIWithRetry(client, {
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [
                {
                    role: "system",
                    content: `You are a professional resume analyzer. Extract and structure information from the resume or job description. 
                    
                    CRITICAL: You MUST respond with ONLY a valid JSON object. Do not include any explanations, markdown, or additional text.
                    
                    Use this exact structure:
                    {
                        "name": "string or null",
                        "email": "string or null", 
                        "phone": "string or null",
                        "location": "string or null",
                        "summary": "string or null",
                        "skills": ["array of strings"],
                        "workExperience": [{"company": "string", "position": "string", "duration": "string", "description": "string"}],
                        "education": [{"institution": "string", "degree": "string", "field": "string", "year": "string"}],
                        "certifications": ["array of strings"],
                        "languages": ["array of strings"],
                        "projects": [{"name": "string", "description": "string", "technologies": ["array of strings"]}],
                        "jobTitle": "string or null",
                        "jobDescription": "string or null"
                    }
                    
                    If any field is not found, use null for strings or empty arrays for arrays. 
                    If this is a job description instead of resume, extract relevant information into appropriate fields.
                    
                    RESPOND WITH ONLY THE JSON OBJECT.`
                },
                {
                    role: "user",
                    content: `Analyze this text and extract information in the required JSON format:\n\n${extractedText.substring(0, 4000)}`
                }
            ],
            temperature: 0.1,
            max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from AI service');
        }

        console.log('AI Response:', responseText);

        // Try to parse the JSON response with improved extraction
        try {
            const parsedData = extractJSONFromResponse(responseText);
            
            // Validate and fill missing fields with defaults
            const defaultData = createDefaultResumeData();
            const mergedData = { ...defaultData, ...parsedData };
            
            // Ensure arrays are actually arrays
            mergedData.skills = Array.isArray(mergedData.skills) ? mergedData.skills : [];
            mergedData.workExperience = Array.isArray(mergedData.workExperience) ? mergedData.workExperience : [];
            mergedData.education = Array.isArray(mergedData.education) ? mergedData.education : [];
            mergedData.certifications = Array.isArray(mergedData.certifications) ? mergedData.certifications : [];
            mergedData.languages = Array.isArray(mergedData.languages) ? mergedData.languages : [];
            mergedData.projects = Array.isArray(mergedData.projects) ? mergedData.projects : [];
            
            return mergedData as ResumeData;
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', responseText);
            console.error('Parse error:', parseError);
            
            // Return a basic structure with the original text for fallback processing
            return {
                ...createDefaultResumeData(),
                summary: extractedText.substring(0, 500),
                jobDescription: extractedText.includes('Job Title:') || extractedText.includes('Job Description:') ? extractedText : undefined
            };
        }

    } catch (error) {
        console.error('AI processing error:', error);
        throw error;
    }
}

export async function generateInterviewQuestions(resumeData: ResumeData): Promise<string[]> {
    try {
        if (!resumeData) {
            throw new Error('No resume data provided');
        }

        // Create a focused prompt based on available data
        let contextInfo = '';
        
        if (resumeData.jobTitle && resumeData.jobDescription) {
            contextInfo = `Job Title: ${resumeData.jobTitle}\nJob Description: ${resumeData.jobDescription}`;
        } else if (resumeData.skills && resumeData.skills.length > 0) {
            contextInfo = `Skills: ${resumeData.skills.join(', ')}`;
            if (resumeData.workExperience && resumeData.workExperience.length > 0) {
                contextInfo += `\nWork Experience: ${resumeData.workExperience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}`;
            }
        } else if (resumeData.summary) {
            contextInfo = `Summary: ${resumeData.summary}`;
        } else {
            contextInfo = JSON.stringify(resumeData);
        }

        const client = getOpenAIClient();
        const completion = await client.chat.completions.create({
            model: "qwen/qwen3-coder:free",
            messages: [
                {
                    role: "system",
                    content: `You are an expert technical interviewer. Generate exactly 10 relevant interview questions with medium to hard difficulty.
                    
                    CRITICAL: Respond with ONLY a JSON array of strings. No explanations, no markdown, no additional text.
                    
                    Format: ["Question 1?", "Question 2?", "Question 3?", ...]
                    
                    Make questions specific to the candidate's background, skills, and experience level.`
                },
                {
                    role: "user",
                    content: `Generate 10 interview questions based on this information:\n\n${contextInfo}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('No response from AI service for questions');
        }

        console.log('Questions AI Response:', responseText);

        try {
            const questions = extractJSONFromResponse(responseText);
            
            if (Array.isArray(questions) && questions.length > 0) {
                return questions.map(q => String(q)).slice(0, 10); // Ensure strings and limit to 10
            } else {
                throw new Error('Response is not a valid array');
            }
        } catch (parseError) {
            console.error('Failed to parse questions response:', responseText);
            
            // Fallback: try to extract questions from plain text response
            const fallbackQuestions = extractQuestionsFromText(responseText);
            if (fallbackQuestions.length > 0) {
                return fallbackQuestions;
            }
            
            // Last resort: return generic questions
            return generateFallbackQuestions(resumeData);
        }

    } catch (error) {
        console.error('Question generation error:', error);
        return generateFallbackQuestions(resumeData);
    }
}

// Helper function to extract questions from plain text
function extractQuestionsFromText(text: string): string[] {
    const questions: string[] = [];
    
    // Try to find numbered questions
    const numberedPattern = /\d+[\.\)]\s*(.+\?)/g;
    let match;
    
    while ((match = numberedPattern.exec(text)) !== null) {
        questions.push(match[1].trim());
    }
    
    // If no numbered questions, try to find sentences ending with ?
    if (questions.length === 0) {
        const questionPattern = /([^.!?]*\?)/g;
        while ((match = questionPattern.exec(text)) !== null) {
            const question = match[1].trim();
            if (question.length > 10) { // Filter out very short questions
                questions.push(question);
            }
        }
    }
    
    return questions.slice(0, 10);
}

// Generate fallback questions when AI fails
function generateFallbackQuestions(resumeData: ResumeData): string[] {
    const fallbackQuestions = [
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
    
    // Customize based on skills if available
    if (resumeData.skills && resumeData.skills.length > 0) {
        const skillsText = resumeData.skills.join(', ');
        fallbackQuestions[0] = `Tell me about your experience with ${skillsText.substring(0, 50)}...`;
    }
    
    return fallbackQuestions;
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