import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Video, Clock, User, CheckCircle2, Calendar, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export type LiveInterviewData = {
    _id: string
    interviewerId: string
    interviewerName: string
    interviewerEmail: string
    candidateName: string
    candidateEmail: string
    position: string
    duration: number
    scheduledTime: string
    interviewType: string
    status: string // "scheduled" | "ongoing" | "completed" | "not-attended"
    interviewLink: string
    createdAt: number
    startedAt?: number | null
    endedAt?: number | null
}

type props = {
    interviewInfo: LiveInterviewData
}

function LiveInterviewCard({ interviewInfo }: props) {
    const isCompleted = interviewInfo.status === 'completed'
    const isOngoing = interviewInfo.status === 'ongoing'
    const isScheduled = interviewInfo.status === 'scheduled'
    const isNotAttended = interviewInfo.status === 'not-attended'
    
    // Check if interview can be joined based on time
    const canJoin = React.useMemo(() => {
        if (isCompleted || isNotAttended) return false;
        
        const now = new Date();
        const scheduled = new Date(interviewInfo.scheduledTime);
        const endTime = new Date(scheduled.getTime() + interviewInfo.duration * 60000);
        
        return now >= scheduled && now <= endTime;
    }, [interviewInfo.scheduledTime, interviewInfo.duration, isCompleted, isNotAttended]);

    // Format scheduled time
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'ongoing':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'scheduled':
                return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'not-attended':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircle2 className='h-3 w-3 mr-1' />
            case 'ongoing':
                return <AlertCircle className='h-3 w-3 mr-1 animate-pulse' />
            case 'scheduled':
                return <Calendar className='h-3 w-3 mr-1' />
            case 'not-attended':
                return <XCircle className='h-3 w-3 mr-1' />
            default:
                return null
        }
    }

    // Get status display text
    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'not-attended':
                return 'Not Attended'
            default:
                return status.charAt(0).toUpperCase() + status.slice(1)
        }
    }

    return (
        <div className='p-3 sm:p-4 lg:p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2'>
                <div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
                    <Video className='h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0' />
                    <div className='min-w-0 flex-1'>
                        <h2 className='font-semibold text-lg sm:text-xl truncate'>
                            {interviewInfo.position}
                        </h2>
                        <p className='text-xs sm:text-sm text-gray-600 mt-1 truncate'>
                            with {interviewInfo.candidateName}
                        </p>
                    </div>
                </div>
                <Badge className={`${getStatusColor(interviewInfo.status)} border flex-shrink-0 text-xs sm:text-sm`}>
                    {getStatusIcon(interviewInfo.status)}
                    {getStatusText(interviewInfo.status)}
                </Badge>
            </div>

            {/* Description */}
            <div className='space-y-2 mb-3 sm:mb-4'>
                <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
                    <User className='h-3 w-3 sm:h-4 sm:w-4' />
                    <span><strong>Candidate:</strong> {interviewInfo.candidateName}</span>
                </div>
                <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
                    <Calendar className='h-3 w-3 sm:h-4 sm:w-4' />
                    <span><strong>Scheduled:</strong> {formatDate(interviewInfo.scheduledTime)}</span>
                </div>
                <div className='flex items-center gap-2 text-xs sm:text-sm text-gray-600'>
                    <Clock className='h-3 w-3 sm:h-4 sm:w-4' />
                    <span><strong>Duration:</strong> {interviewInfo.duration} minutes</span>
                </div>
                <div className='flex items-center gap-2 text-xs sm:text-sm text-purple-600'>
                    <Video className='h-3 w-3 sm:h-4 sm:w-4' />
                    <span><strong>Type:</strong> {interviewInfo.interviewType.toUpperCase()}</span>
                </div>
            </div>

            {/* Status-specific info */}
            {isOngoing && (
                <div className='bg-blue-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200'>
                    <div className='flex items-center gap-2 text-xs sm:text-sm text-blue-700'>
                        <AlertCircle className='h-4 w-4 animate-pulse' />
                        <span className='font-medium'>Interview in progress</span>
                    </div>
                </div>
            )}

            {isScheduled && (
                <div className='bg-purple-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-purple-200'>
                    <div className='flex items-center gap-2 text-xs sm:text-sm text-purple-700'>
                        <Calendar className='h-4 w-4' />
                        <span className='font-medium'>Scheduled interview</span>
                    </div>
                </div>
            )}

            {isCompleted && (
                <div className='bg-green-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-green-200'>
                    <div className='flex items-center gap-2 text-xs sm:text-sm text-green-700'>
                        <CheckCircle2 className='h-4 w-4' />
                        <span className='font-medium'>Interview completed successfully</span>
                    </div>
                </div>
            )}

            {isNotAttended && (
                <div className='bg-orange-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 border border-orange-200'>
                    <div className='flex items-center gap-2 text-xs sm:text-sm text-orange-700'>
                        <XCircle className='h-4 w-4' />
                        <span className='font-medium'>Interview was not attended</span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className='flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3'>
                <div className='flex-1 order-2 sm:order-1'>
                    {isCompleted ? (
                        <div className='text-xs sm:text-sm text-gray-500 italic p-2 sm:p-0'>
                            Interview completed
                        </div>
                    ) : isNotAttended ? (
                        <div className='text-xs sm:text-sm text-orange-600 italic p-2 sm:p-0'>
                            No one joined the interview
                        </div>
                    ) : (
                        <div className='text-xs sm:text-sm text-gray-500 italic p-2 sm:p-0'>
                            {isOngoing ? 'Join to continue' : 'Join when ready'}
                        </div>
                    )}
                </div>

                {/* Join Interview Button */}
                <div className='flex-shrink-0 order-1 sm:order-2'>
                    {isCompleted || isNotAttended || !canJoin ? (
                        <Button 
                            variant={'outline'} 
                            disabled 
                            className='w-full sm:w-auto opacity-50 cursor-not-allowed text-xs sm:text-sm px-3 sm:px-4 py-2'
                        >
                            {isCompleted ? 'Completed' : isNotAttended ? 'Not Attended' : 'Not Available'}
                        </Button>
                    ) : (
                        <Link href={`/liveInterview/${interviewInfo.interviewLink}`}>
                            <Button variant={'outline'} className='w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'>
                                <span>{isOngoing ? 'Join' : 'Start'} Interview</span>
                                <ArrowRight className='h-3 w-3 sm:h-4 sm:w-4' />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Interview Type Indicator */}
            <div className='mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-1 sm:gap-2 text-xs text-gray-500'>
                        <Video className='h-3 w-3' />
                        <span>Live 1:1 Interview</span>
                    </div>
                    {interviewInfo.startedAt && interviewInfo.endedAt && (
                        <div className='text-xs text-gray-500'>
                            Duration: {Math.round((interviewInfo.endedAt - interviewInfo.startedAt) / 60000)} mins
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LiveInterviewCard