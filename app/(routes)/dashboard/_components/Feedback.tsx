import { DialogHeader } from '@/components/ui/dialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Star, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import React from 'react'

type props = {
    feedbackInfo: FeedbackInfo | null
}

export type FeedbackInfo = {
    Score: number,
    strengths: string[],
    weaknesses: string[],
    recommendations: string[]
}

function Feedback({ feedbackInfo }: props) {
    if (!feedbackInfo) {
        return (
            <Button variant="outline" disabled className="opacity-50">
                <Target className="h-4 w-4 mr-2" />
                No Feedback Available
            </Button>
        );
    }
    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600 bg-green-100'
        if (score >= 6) return 'text-yellow-600 bg-yellow-100'
        return 'text-red-600 bg-red-100'
    }

    const renderStarRating = (score: number) => {
        const stars = Math.round(score / 2) // Convert 10-point scale to 5-star
        return (
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-2 text-sm text-gray-600">({score}/10)</span>
            </div>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="mine" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    View Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className='font-bold text-2xl flex items-center gap-2'>
                        <Target className="h-6 w-6 text-blue-600" />
                        Interview Feedback
                    </DialogTitle>
                    <DialogDescription className="text-base text-gray-600">
                        Detailed analysis of your interview performance
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Overall Score Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Overall Score
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                {renderStarRating(feedbackInfo?.Score || 0)}
                            </div>
                            <Badge className={`text-lg font-bold px-3 py-1 ${getScoreColor(feedbackInfo?.Score || 0)}`}>
                                {feedbackInfo?.Score || 0}/10
                            </Badge>
                        </div>
                    </div>

                    {/* Strengths Section */}
                    {feedbackInfo?.strengths && feedbackInfo.strengths.length > 0 && (
                        <div>
                            <h3 className='font-semibold text-lg mb-3 flex items-center gap-2 text-green-700'>
                                <TrendingUp className='h-5 w-5' />
                                Strengths
                            </h3>
                            <div className='space-y-2'>
                                {feedbackInfo.strengths.map((strength, idx) => (
                                    <div 
                                        key={idx} 
                                        className='p-3 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-2'
                                    >
                                        <ArrowRight className='h-4 w-4 text-green-600 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm text-green-800'>{strength}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Weaknesses Section */}
                    {feedbackInfo?.weaknesses && feedbackInfo.weaknesses.length > 0 && (
                        <div>
                            <h3 className='font-semibold text-lg mb-3 flex items-center gap-2 text-orange-700'>
                                <AlertTriangle className='h-5 w-5' />
                                Areas for Improvement
                            </h3>
                            <div className='space-y-2'>
                                {feedbackInfo.weaknesses.map((weakness, idx) => (
                                    <div 
                                        key={idx} 
                                        className='p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg flex items-start gap-2'
                                    >
                                        <ArrowRight className='h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm text-orange-800'>{weakness}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations Section */}
                    {feedbackInfo?.recommendations && feedbackInfo.recommendations.length > 0 && (
                        <div>
                            <h3 className='font-semibold text-lg mb-3 flex items-center gap-2 text-blue-700'>
                                <Target className='h-5 w-5' />
                                Recommendations
                            </h3>
                            <div className='space-y-2'>
                                {feedbackInfo.recommendations.map((recommendation, idx) => (
                                    <div 
                                        key={idx} 
                                        className='p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex items-start gap-2'
                                    >
                                        <ArrowRight className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm text-blue-800'>{recommendation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {(!feedbackInfo || (!feedbackInfo.strengths?.length && !feedbackInfo.weaknesses?.length && !feedbackInfo.recommendations?.length)) && (
                        <div className="text-center py-8 text-gray-500">
                            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-lg font-medium">No feedback available yet</p>
                            <p className="text-sm">Complete an interview to receive detailed feedback</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default Feedback