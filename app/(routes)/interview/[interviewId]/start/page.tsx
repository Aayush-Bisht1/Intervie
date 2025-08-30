"use client"
import { FeedbackInfo } from '@/app/(routes)/dashboard/_components/Feedback';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import Vapi from '@vapi-ai/web';
import profile from '@/app/_assets/interviewer.png'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Circle, PhoneCall, PhoneOff } from 'lucide-react';
import Timer from '@/app/(routes)/_components/Timer';

export type InterviewData = {
    interviewQuestions: [],
    jobDescription: string | null,
    jobTitle: string | null,
    userId: string,
    _id: string,
    resumeUrl: string | null,
    status: string,
    feedback: FeedbackInfo | null
}

function startInterview() {
    const { interviewId } = useParams();
    const convex = useConvex();
    const [interviewData, setInterviewData] = useState<InterviewData | []>();
    const [messages, setMessages] = useState<string[]>()
    const [callStarted, setCallStarted] = useState(false)

    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);

    const startCall = () => {
        vapi.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID);
        vapi.on('call-start', () => {
            console.log('Call started')
            setCallStarted(true)
        });
        vapi.on('call-end', () => {
            console.log('Call ended')
            setCallStarted(false)
        });
        vapi.on('message', (message) => {
            if (message.type === 'transcript') {
                console.log(`${message.role}: ${message.transcript}`);
            }
        });
    }

    const getInterviewQuestions = async () => {
        const result = await convex.query(api.interview.getInterviewQuestions, {
            //@ts-ignore
            interviewId: interviewId
        })
        console.log(result);

        setInterviewData(result);
        console.log(interviewData);

    }
    useEffect(() => {
        getInterviewQuestions();
    }, [interviewId])

    return (
        <div className='flex flex-col md:flex-row w-full min-h-screen bg-gray-100'>
            <div className='flex flex-col items-center p-6 md:w-2/3 '>
                <h2 className='text-3xl font-bold mt-16 mb-6'>Interview Session</h2>
                <div className='rounded-2xl flex items-top justify-between p-3 space-y-5 md:space-y-14 bg-gray-200 w-full md:w-[70%] md:h-[55%]'>
                    <div>
                        <div className='flex gap-2 text-lg items-center'>
                            <Circle
                                className={`h-4 w-4 rounded-full ${!callStarted ? 'bg-red-500' : 'bg-green-500'}`} />
                            <h2 className='hidden lg:block text-md'>{!callStarted ?
                                'Not Connected' :
                                'Connected'
                            }</h2>
                        </div>
                    </div>
                    <div>
                        <Image src={profile} alt='interviewer'
                            className='w-40 h-40 md:w-[250px] md:h-[250px]'
                        />
                        {
                            !callStarted ? <Button onClick={startCall}><PhoneCall />
                                Start Interview</Button>
                                :
                                <Button><PhoneOff /> End Interview</Button>
                        }
                    </div>
                    <div>
                        <h2 className='text-gray-500'>00:00</h2>
                    </div>
                </div>
            </div>
            <div className='flex flex-col p-6 lg:w-1/3 '>
                <h2 className='text-lg font-semibold my-4'>Conversation</h2>
                <div className='flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4 space-y-3'>
                    {
                        messages?.length == 0 ?
                            <div>
                                <p>No meassages yet !</p>
                            </div>
                            :
                            <div>
                                {
                                    messages?.map((msg, idx) => (
                                        <div key={idx}>
                                            <h2>{msg}</h2>
                                        </div>
                                    ))
                                }
                            </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default startInterview