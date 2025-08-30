import React from 'react'
import { InterviewData } from '../../interview/[interviewId]/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Briefcase, Lock, Star, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import Feedback from './Feedback'

type props = {
    interviewInfo: InterviewData
}

function InterviewCard({ interviewInfo }: props) {
    const isCompleted = interviewInfo.status === 'Completed'
    const isResumeInterview = !!interviewInfo?.resumeUrl
    const hasFeedback = !!interviewInfo?.feedback

    // Calculate completion stats if feedback exists
    const getCompletionStats = () => {
        if (!hasFeedback || !interviewInfo.feedback) return null;
        
        const totalQuestions = interviewInfo.interviewQuestions?.length || 0;
        const score = interviewInfo.feedback.Score || 0;
        const attempted = interviewInfo.feedback.Score;
        
        return {
            questionsAttempted: attempted,
            totalQuestions,
            accuracy: score,
            completionRate: attempted
        };
    };

    const stats = getCompletionStats();

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'in progress':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'draft':
                return 'bg-gray-100 text-gray-800 border-gray-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className='p-3 sm:p-4 lg:p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2'>
                <div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
                    {isResumeInterview ? (
                        <FileText className='h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0' />
                    ) : (
                        <Briefcase className='h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0' />
                    )}
                    <div className='min-w-0 flex-1'>
                        <h2 className='font-semibold text-lg sm:text-xl truncate'>
                            {isResumeInterview ? 'Resume-Based Interview' : interviewInfo.jobTitle}
                        </h2>
                        {isResumeInterview && interviewInfo.jobTitle && (
                            <p className='text-xs sm:text-sm text-gray-600 mt-1 truncate'>
                                Position: {interviewInfo.jobTitle}
                            </p>
                        )}
                    </div>
                </div>
                <Badge className={`${getStatusColor(interviewInfo.status)} border flex-shrink-0 text-xs sm:text-sm`}>
                    {isCompleted && <CheckCircle2 className='h-3 w-3 mr-1' />}
                    {interviewInfo.status}
                </Badge>
            </div>

            {/* Description */}
            <p className='text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2'>
                {isResumeInterview 
                    ? 'AI-generated interview questions based on your uploaded resume and job requirements.'
                    : interviewInfo.jobDescription || 'Custom interview questions for this position.'
                }
            </p>

            {/* Completion Stats (only show if completed) */}
            {isCompleted && stats && (
                <div className='bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4'>
                    <h3 className='font-medium text-xs sm:text-sm text-gray-700 mb-2'>Interview Results</h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm'>
                        <div className='flex items-center gap-2'>
                            <CheckCircle2 className='h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0' />
                            <span className='text-gray-600'>Questions:</span>
                            <span className='font-medium'>{stats.questionsAttempted}/{stats.totalQuestions}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Star className='h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0' />
                            <span className='text-gray-600'>Score:</span>
                            <span className='font-medium'>{stats.accuracy}/10</span>
                        </div>
                    </div>
                    <div className='mt-2'>
                        <div className='flex items-center justify-between text-xs text-gray-500 mb-1'>
                            <span>Completion Rate</span>
                            <span>{stats.completionRate*10}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-1.5 sm:h-2'>
                            <div 
                                className='bg-green-500 h-1.5 sm:h-2 rounded-full transition-all duration-300'
                                style={{ width: `${stats.completionRate*10}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Question Count Preview */}
            {!isCompleted && (
                <div className='bg-blue-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4'>
                    <div className='flex items-center gap-2 text-xs sm:text-sm text-blue-700'>
                        <span className='font-medium'>{interviewInfo.interviewQuestions?.length || 0} questions</span>
                        <span className='text-blue-500'>•</span>
                        <span>Ready to start</span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3'>
                {/* Feedback Button */}
                <div className='flex-1 order-2 sm:order-1'>
                    {hasFeedback ? (
                        <Feedback feedbackInfo={interviewInfo.feedback} />
                    ) : (
                        <div className='text-xs sm:text-sm text-gray-500 italic p-2 sm:p-0'>
                            Complete interview to view feedback
                        </div>
                    )}
                </div>

                {/* Start Interview Button */}
                <div className='flex-shrink-0 order-1 sm:order-2'>
                    {isCompleted ? (
                        <Button 
                            variant={'outline'} 
                            disabled 
                            className='w-full sm:w-auto opacity-50 cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2'
                        >
                            <Lock className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
                            <span className="hidden sm:inline">Interview </span>Completed
                        </Button>
                    ) : (
                        <Link href={`/interview/${interviewInfo._id}`}>
                            <Button variant={'outline'} className='w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2'>
                                <span className="hidden sm:inline">Start </span>Interview
                                <ArrowRight className='h-3 w-3 sm:h-4 sm:w-4' />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Interview Type Indicator */}
            <div className='mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100'>
                <div className='flex items-center gap-1 sm:gap-2 text-xs text-gray-500'>
                    {isResumeInterview ? (
                        <>
                            <FileText className='h-3 w-3' />
                            <span>AI-Generated from Resume</span>
                        </>
                    ) : (
                        <>
                            <Briefcase className='h-3 w-3' />
                            <span>Job Description Based</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default InterviewCard