"use client"
import { FeedbackInfo } from '@/app/(routes)/dashboard/_components/Feedback';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react'
import Vapi from '@vapi-ai/web';
import profile from '@/app/_assets/interviewer.png'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Circle, PhoneCall, PhoneOff } from 'lucide-react';
import axios from 'axios';

export type InterviewData = {
    interviewQuestions: string[],
    jobDescription: string | null,
    jobTitle: string | null,
    userId: string,
    _id: string,
    resumeUrl: string | null,
    status: string,
    feedback: FeedbackInfo | null
}

export type TranscriptMessage = {
    role: 'user' | 'assistant',
    content: string,
    timestamp: Date,
    messageId: string
}

function StartInterview() {
    const { interviewId } = useParams();
    const convex = useConvex();
    const router = useRouter();

    // State management
    const [interviewQuestions, setInterviewQuestions] = useState<string[]>([])
    const [messages, setMessages] = useState<TranscriptMessage[]>([])
    const [callStarted, setCallStarted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [vapi, setVapi] = useState<Vapi | null>(null)
    const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set())
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)

    // Initialize VAPI
    useEffect(() => {
        const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
        setVapi(vapiInstance);

        return () => {
            // Cleanup on unmount
            vapiInstance.stop();
        };
    }, []);

    // Get interview questions
    const getInterviewQuestions = useCallback(async () => {
        try {
            setIsLoading(true);

            const result = await convex.query(api.interview.getInterviewQuestions, {
                //@ts-ignore
                interviewId
            });

            // console.log('Fetched questions:', result.interviewQuestions);
            if (result.status === 'Completed') {
                console.log('Interview already completed, redirecting to dashboard');
                router.push('/dashboard');
                return;
            }

            if (result.interviewQuestions && Array.isArray(result.interviewQuestions)) {
                setInterviewQuestions(result.interviewQuestions);
            } else {
                console.error('Interview questions not found or invalid format');
                setInterviewQuestions([]);
            }
        } catch (error) {
            console.error('Error fetching interview questions:', error);
            setInterviewQuestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [convex, interviewId, router]);

    // Start the call with existing VAPI agent
    const startCall = useCallback(async () => {
        if (!vapi || interviewQuestions.length === 0) {
            console.error('VAPI not initialized or no questions available');
            return;
        }

        try {
            setMessages([]);
            setCallDuration(0);
            setProcessedMessageIds(new Set());
            // Use your existing VAPI assistant ID with context
            await vapi.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID!, {
                variableValues: {
                    interviewQuestions: JSON.stringify(interviewQuestions),
                    currentQuestionIndex: 0,
                    totalQuestions: interviewQuestions.length,
                    interviewId
                }
            });
        } catch (error) {
            console.error('Error starting call:', error);
        }
    }, [vapi, interviewQuestions]);

    // End the call
    const endCall = useCallback(() => {
        if (vapi) {
            vapi.stop();
        }
    }, [vapi]);

    // Generate feedback from transcript using LLM
    const generateAndStoreFeedback = async () => {
        try {
            setIsGeneratingFeedback(true);
            console.log('Generating feedback from transcript...');

            if (messages.length === 0) {
                console.log('No messages to generate feedback from');
                return;
            }
            // Calculate interview stats
            const userMessages = messages.filter(msg => msg.role === 'user');
            const totalQuestions = interviewQuestions.length;
            const questionsAttempted = userMessages.length;

            // Prepare transcript for LLM
            const conversationText = messages.map(msg =>
                `${msg.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${msg.content}`
            ).join('\n\n');

            // Call your API endpoint to generate feedback
            const response = await axios.post('/api/generate-feedback', {
                transcript: conversationText,
                interviewQuestions: interviewQuestions,
                interviewId: interviewId,
                questionsAttempted,
                totalQuestions
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.data) {
                throw new Error('Failed to generate feedback - no data received');
            }


            // Store feedback in the interview session
            await convex.mutation(api.interview.storeFeedback, {
                interviewId: interviewId as string,
                feedback: response.data.feedback,
            });

            console.log('Feedback generated and stored successfully');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (error) {
            console.error('Error generating feedback:', error);
        }
    };

    // Set up VAPI event listeners
    useEffect(() => {
        if (!vapi) return;

        // Call start event
        vapi.on('call-start', async () => {
            console.log('Call started');
            setCallStarted(true);
        });

        // Call end event
        vapi.on('call-end', async () => {
            console.log('Call ended');
            setCallStarted(false);

            // Generate feedback from transcript
            await generateAndStoreFeedback();
        });

        // Message events for transcripts
        vapi.on('message', (message: any) => {
            console.log('Received message:', message);

            if (message.type === 'transcript' && message.transcript?.trim()) {
                // Create unique message ID to prevent duplicates
                const messageId = `${message.role}-${Date.now()}-${Math.random()}`;
                
                // Check if we've already processed this message
                if (processedMessageIds.has(messageId)) {
                    return;
                }

                const newMessage: TranscriptMessage = {
                    role: message.role === 'assistant' ? 'assistant' : 'user',
                    content: message.transcript.trim(),
                    timestamp: new Date(),
                    messageId: messageId
                };

                setMessages(prev => {
                    // Additional check to prevent duplicate content
                    const isDuplicate = prev.some(msg => 
                        msg.role === newMessage.role && 
                        msg.content === newMessage.content &&
                        Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000 // Within 2 seconds
                    );
                    
                    if (isDuplicate) {
                        return prev;
                    }
                    
                    return [...prev, newMessage];
                });

                setProcessedMessageIds(prev => new Set([...prev, messageId]));

                console.log(`${message.role}: ${message.transcript}`);
            }

            // Handle function calls if your VAPI agent uses them
            if (message.type === 'function-call') {
                console.log('Function call:', message);
            }
        });

        // Error handling
        vapi.on('error', (error: any) => {
            console.error('VAPI Error:', error);
        });

        // Speech start/end events for better user feedback
        vapi.on('speech-start', () => {
            console.log('User started speaking');
        });

        vapi.on('speech-end', () => {
            console.log('User stopped speaking');
        });

        // Cleanup event listeners
        return () => {
            vapi.removeAllListeners();
        };
    }, [vapi, messages, convex, interviewId, interviewQuestions, processedMessageIds]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (callStarted) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callStarted]);

    // Format duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Load interview questions on mount
    useEffect(() => {
        if (interviewId) {
            getInterviewQuestions();
        }
    }, [interviewId, getInterviewQuestions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading interview questions...</div>
            </div>
        );
    }

    if (isGeneratingFeedback) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-lg font-medium">Generating your feedback...</div>
                    <div className="text-sm text-gray-600 mt-2">This may take a few moments</div>
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col md:flex-row w-full min-h-screen bg-gray-100'>
            {/* Main Interview Area */}
            <div className='flex flex-col items-center p-6 md:w-2/3'>
                <h2 className='text-3xl font-bold mt-16 mb-6'>Interview Session</h2>

                {/* Interview Status */}
                <div className='w-full md:w-[70%] mb-4 p-4 bg-white rounded-lg shadow-sm'>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold'>
                            {!callStarted ? 'Ready to Start Interview' : 'Interview in Progress'}
                        </h3>
                        <span className='text-sm text-gray-600'>
                            {interviewQuestions.length} questions prepared
                        </span>
                    </div>
                    {callStarted && (
                        <div className='mt-2 text-sm text-blue-600'>
                            The interviewer will guide you through the questions
                        </div>
                    )}
                </div>

                {/* Call Interface */}
                <div className='rounded-2xl flex flex-col items-center justify-center p-6 space-y-6 bg-gray-200 w-full md:w-[70%] md:h-[55%]'>
                    {/* Connection Status */}
                    <div className='flex gap-2 text-lg items-center'>
                        <Circle
                            className={`h-4 w-4 rounded-full ${!callStarted ? 'bg-red-500' : 'bg-green-500'}`}
                        />
                        <h2 className='block text-md'>
                            {!callStarted ? 'Not Connected' : 'Connected'}
                        </h2>
                    </div>

                    {/* Interviewer Avatar */}
                    <div className='flex flex-col items-center space-y-4'>
                        <Image
                            src={profile}
                            alt='interviewer'
                            className='w-40 h-40 md:w-[250px] md:h-[250px] rounded-full'
                        />

                        {/* Call Controls */}
                        {!callStarted ? (
                            <Button
                                onClick={startCall}
                                disabled={interviewQuestions.length === 0}
                                className="flex items-center gap-2"
                                variant={'mine'}
                            >
                                <PhoneCall className="h-4 w-4" />
                                Start Interview
                            </Button>
                        ) : (
                            <Button
                                onClick={endCall}
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                <PhoneOff className="h-4 w-4" />
                                End Interview
                            </Button>
                        )}
                    </div>

                    {/* Timer */}
                    <div className='text-center'>
                        <h2 className='text-gray-500 text-xl font-mono'>
                            {formatDuration(callDuration)}
                        </h2>
                        {callStarted && (
                            <p className='text-sm text-gray-500 mt-1'>
                                Interview in progress...
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Conversation Transcript */}
            <div className='flex flex-col p-6 lg:w-1/3 bg-white'>
                <h2 className='text-xl font-semibold md:mt-16 mb-4'>Live Transcript</h2>
                <div className='flex-1 max-h-screen overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-3 max-h-[600px]'>
                    {messages.length === 0 ? (
                        <div className='text-center text-gray-500 py-8'>
                            <p>No messages yet!</p>
                            <p className='text-sm mt-2'>Start the interview to see the conversation transcript here.</p>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {messages.map((msg, idx) => (
                                <div
                                    key={msg.messageId} // Use unique messageId instead of index
                                    className={`p-3 rounded-lg ${msg.role === 'assistant'
                                        ? 'bg-blue-50 border-l-4 border-blue-500'
                                        : 'bg-gray-50 border-l-4 border-gray-500'
                                        }`}
                                >
                                    <div className='flex justify-between items-start mb-1'>
                                        <span className={`text-xs font-semibold ${msg.role === 'assistant' ? 'text-blue-600' : 'text-gray-600'
                                            }`}>
                                            {msg.role === 'assistant' ? 'Interviewer' : 'You'}
                                        </span>
                                        <span className='text-xs text-gray-400'>
                                            {msg.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className='text-sm text-gray-800'>{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Auto-scroll indicator */}
                {callStarted && messages.length > 0 && (
                    <div className='mt-2 text-xs text-gray-500 text-center'>
                        Live transcription active
                    </div>
                )}
            </div>
        </div>
    )
}

export default StartInterview