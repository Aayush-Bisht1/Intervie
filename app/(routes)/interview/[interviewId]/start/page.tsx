"use client"
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

export type InterviewData = {
    interviewQuestions: [] | null,
    jobDescription: string | null,
    jobTitle: string | null,
    userId: string | null,
    _id: string,
    resumeUrl: string | null,
    status: string | null,
    feedback: [] | null
}

function startInterview() {
    const { interviewId } = useParams();
    const convex = useConvex();
    const [interviewData, setInterviewData] = useState<InterviewData>();

    const getInterviewQuestions = async () => {
        const result = await convex.query(api.interview.getInterviewQuestions, {
            //@ts-ignore
            interviewId: interviewId
        })
        // console.log(result);

        setInterviewData(result);
    }
    useEffect(() => {
        getInterviewQuestions();
    }, [interviewId])

    return (
        <div>
            <h1>hii</h1>
        </div>
    )
}

export default startInterview