import { DialogHeader } from '@/components/ui/dialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog'
import { ArrowRight } from 'lucide-react'
import React from 'react'

type props = {
    feedbackInfo: FeedbackInfo
}
export type FeedbackInfo = {
    feedback: string,
    rating: number,
    suggestions: string[]
}

function Feedback({ feedbackInfo }: props) {
    return (
        <Dialog>
            <DialogTrigger>Feedback</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className='font-bold text-2xl'>Interview Feedback</DialogTitle>
                    <DialogDescription>
                        <div>
                            <h2 className='font-bold text-xl text-black'>Feedback:</h2>
                            <p className='text-lg'>{feedbackInfo?.feedback}</p>
                            <div>
                                <h2 className='font-bold text-xl text-black'>Suggestions:</h2>
                                {feedbackInfo?.suggestions.map((item, idx) => (
                                    <h2 className='p-4 my-1 bg-gray-50 rounded-lg flex items-center' key={idx}><ArrowRight className='h-4 w-4'/>{item}</h2>
                                ))}
                            </div>
                            <h2 className='font-bold text-xl text-black'>Rating: <span>{feedbackInfo?.rating}</span></h2>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default Feedback