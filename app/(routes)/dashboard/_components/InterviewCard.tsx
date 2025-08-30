import React from 'react'
import { InterviewData } from '../../interview/[interviewId]/start/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Feedback from './Feedback'

type props = {
    interviewInfo: InterviewData
}
function InterviewCard({ interviewInfo }: props) {
    return (
        <div className='p-4 border rounded-xl'>
            <h2 className='font-semibold text-2xl flex items-center justify-between'>{interviewInfo?.resumeUrl ? 'Resume Interview' : interviewInfo.jobTitle}
                <Badge variant={'mine'}>{interviewInfo.status}</Badge>
            </h2>
            <p className='line-clamp-2 text-gray-500'>{interviewInfo?.resumeUrl ? 'We generated the Interview from the uploaded resume.' : interviewInfo.jobDescription}</p>
            <div className='mt-5 flex items-center justify-between'>
                {interviewInfo?.feedback &&
                    <Feedback feedbackInfo={interviewInfo.feedback}/>
                }
                <Link href={`/interview/${interviewInfo._id}/start`}>
                    <Button variant={'outline'}>Start Interview <ArrowRight /></Button>
                </Link>
            </div>
        </div>
    )
}

export default InterviewCard