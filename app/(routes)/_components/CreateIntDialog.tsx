"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResumeUpload from './ResumeUpload'
import JobDescription from './JobDescription'

function CreateIntDialog() {
    const [formData, setFormData] = useState<any>();
    const onHandleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    }
    return (
        <div>
            <Dialog>
                <DialogTrigger>
                    <Button size={'lg'} className='bg-purple-700 hover:bg-purple-800'>+ Create Interview</Button>
                </DialogTrigger>
                <DialogContent className='min-w-3xl'>
                    <DialogHeader>
                        <DialogTitle>Please submit following details.</DialogTitle>
                        <DialogDescription>
                            <Tabs defaultValue="resume" className="w-full mt-2">
                                <TabsList>
                                    <TabsTrigger value="resume-upload">Resume Upload</TabsTrigger>
                                    <TabsTrigger value="job-description">Job Desciption</TabsTrigger>
                                </TabsList>
                                <TabsContent value="resume-upload"><ResumeUpload onHandleInputChange={onHandleInputChange} /></TabsContent>
                                <TabsContent value="job-description"><JobDescription onHandleInputChange={onHandleInputChange}/></TabsContent>
                            </Tabs>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose className='flex gap-3 items-center'>
                            <Button className='bg-gray-200 text-gray-700 hover:bg-gray-300'>Cancel</Button>
                            <Button className='bg-purple-700 hover:bg-purple-800'>Submit</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CreateIntDialog