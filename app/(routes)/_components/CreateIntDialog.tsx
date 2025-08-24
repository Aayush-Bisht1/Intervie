"use client"
import React, { useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ResumeUpload from './ResumeUpload'
import JobDescription from './JobDescription'
import axios from 'axios'

function CreateIntDialog() {
    const [formData, setFormData] = useState<any>();
    const [file, setFile] = useState<File | null>();
    const [loading, setLoading] = useState(false);
    
    const onHandleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    }
    
    const onHandleSubmit = async () => {
        setLoading(true);
        if (!file) return;
        const formDataToSend = new FormData();
        formDataToSend.append('file', file);
        try {
            const res = await axios.post('/api/generate-interview-questions', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            console.log(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size={'lg'} className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg'>
                        + Create Interview
                    </Button>
                </DialogTrigger>
                <DialogContent className='max-w-4xl max-h-[90vh]'>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            Create New Interview
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-gray-600 mt-2">
                                Please provide the following details to create your personalized interview.
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <Tabs defaultValue="resume-upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger 
                                    value="resume-upload"
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                                >
                                    Resume Upload
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="job-description"
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                                >
                                    Job Description
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="resume-upload" className="mt-2">
                                <ResumeUpload setFiles={(file: File) => setFile(file)} />
                            </TabsContent>
                            <TabsContent value="job-description" className="mt-6">
                                <JobDescription onHandleInputChange={onHandleInputChange} />
                            </TabsContent>
                        </Tabs>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <DialogClose asChild>
                            <Button 
                                variant="outline" 
                                className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button 
                            onClick={onHandleSubmit} 
                            disabled={loading || !file}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                'Create Interview'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CreateIntDialog