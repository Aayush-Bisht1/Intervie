import { Label } from '@/components/ui/label'
import React from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

function JobDescription({onHandleInputChange}: any) {
    return (
        <div className='my-4 flex flex-col gap-4 w-full max-w-4xl mx-auto'>
            <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input placeholder="Ex. Full Stack Developer" onChange={(e) => onHandleInputChange('jobTitle', e.target.value)} />
            </div>
            <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea placeholder="Describe the Job Description ..." className='h-60' onChange={(e) => onHandleInputChange('jobDescription', e.target.value)} />
            </div>
        </div>
    )
}

export default JobDescription