"use client"
import React, { useContext, useState } from 'react'
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
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { v4 as uuidv4 } from 'uuid';
import { useUserDetailContext } from '@/app/Provider'
import { userDetailContext } from '@/context/userDetailContext'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import { on } from 'events'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function CreateIntDialog() {
    const [formDataJD, setFormDataJD] = useState<any>();
    const [file, setFile] = useState<File | null>();
    const [loading, setLoading] = useState(false);
    const { userDetail, setUserDetail } = useContext(userDetailContext);
    const saveInterviewQuestions = useMutation(api.interview.saveInterviewQuestions);
    const [liveInterviewData, setLiveInterviewData] = useState({
        interviewerName: '',
        interviewerEmail: '',
        candidateName: '',
        candidateEmail: '',
        position: '',
        scheduledTime: '',
    });
    const createLiveInterview = useMutation(api.liveInterview.createLiveInterview);
    const [interviewType, setInterviewType] = useState('technical');
    const [duration, setDuration] = useState('30');

    const router = useRouter();

    async function getUserId() {
        const userid = await userDetail.then((res: any) => res._id);
        return userid;
    }

    const onHandleInputChangeLive = (e: any) => {
        const { name, value } = e.target;
        setLiveInterviewData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const onHandleSubmitLive = async () => {
        setLoading(true);
        try {
            // Validate required fields
            if (!liveInterviewData.interviewerName || 
                !liveInterviewData.interviewerEmail || 
                !liveInterviewData.candidateName || 
                !liveInterviewData.candidateEmail || 
                !liveInterviewData.position || 
                !liveInterviewData.scheduledTime) {
                toast.error('Please fill in all required fields');
                setLoading(false);
                return;
            }

            // Generate unique interview link
            const interviewLink = uuidv4();

            // Get user ID
            const userId = await getUserId();
            / Create interview in database
            const interviewId = await createLiveInterview({
                interviewerId: userId,
                interviewerName: liveInterviewData.interviewerName,
                interviewerEmail: liveInterviewData.interviewerEmail,
                candidateName: liveInterviewData.candidateName,
                candidateEmail: liveInterviewData.candidateEmail,
                position: liveInterviewData.position,
                duration: parseInt(duration),
                scheduledTime: liveInterviewData.scheduledTime,
                interviewType: interviewType,
                interviewLink: interviewLink,
            });

            // Send emails
            await axios.post('/api/send-interview-email', {
                interviewerEmail: liveInterviewData.interviewerEmail,
                interviewerName: liveInterviewData.interviewerName,
                candidateEmail: liveInterviewData.candidateEmail,
                candidateName: liveInterviewData.candidateName,
                interviewLink: interviewLink,
                scheduledTime: liveInterviewData.scheduledTime,
                position: liveInterviewData.position,
                duration: duration,
                interviewType: interviewType,
            });

            toast.success('Interview scheduled successfully! Emails sent to both parties.');
            
            // Reset form
            setLiveInterviewData({
                interviewerName: '',
                interviewerEmail: '',
                candidateName: '',
                candidateEmail: '',
                position: '',
                duration: '30',
                scheduledTime: '',
                interviewType: 'technical'
            });
            
            // Close dialog (you might need to handle this differently)
            window.location.reload();
        } catch (error: any) {
            console.error('Error scheduling interview:', error);
            toast.error('Failed to schedule interview: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const onHandleInputChange = (field: string, value: string) => {
        setFormDataJD((prev: any) => ({
            ...prev,
            [field]: value
        }));
    }

    const onHandleSubmit = async () => {
        setLoading(true);
        let formDataToSend = new FormData();
        if (!file && !formDataJD) return;
        if (file) {
            formDataToSend.append('file', file);
            console.log(formDataToSend);
        }
        if (formDataJD) {
            Object.keys(formDataJD).forEach((key) => {
                formDataToSend.append(key, formDataJD[key]);
            });
            console.log(formDataToSend);
        }

        try {
            const res = await axios.post('/api/generate-interview-questions', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            if (res?.data?.status == 429) {
                toast.warning(res?.data?.result);
                return;
            }
            // console.log(res);

            const userid = await getUserId();
            const interviewId = await saveInterviewQuestions({
                resumeUrl: res.data?.resumeUrl,
                questions: res.data.interviewQuestions,
                uid: userid,
                jobtitle: res.data?.jobTitle,
                jobdescription: res.data?.JobDescription
            })
            console.log(interviewId);
            router.push('/interview/' + interviewId);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='flex gap-4'>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size={'lg'} className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg'>
                        + Create AI Interview
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
                                className="bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-800 border-gray-300"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={onHandleSubmit}
                            disabled={loading}
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
            <Dialog>
                <DialogTrigger asChild>
                    <Button size={'lg'} className='bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg'>
                        + Schedule Live Interview
                    </Button>
                </DialogTrigger>
                <DialogContent className='max-w-4xl max-h-[90vh]'>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-900">
                            Schedule Live 1:1 Interview
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-gray-600 mt-2">
                                Please provide the following details to schedule your live interview session.
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <Tabs defaultValue="interview-details" className="w-full">
                            <TabsList className="grid w-full grid-cols-1 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger
                                    value="interview-details"
                                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                                >
                                    Interview Details
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="interview-details" className="mt-6 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                                {/* Interviewer Details Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Interviewer Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name *
                                            </Label>
                                            <Input
                                                type="text"
                                                name="interviewerName"
                                                value={liveInterviewData.interviewerName}
                                                onChange={onHandleInputChangeLive}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent"
                                                placeholder="John Smith"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </Label>
                                            <Input
                                                type="email"
                                                name="interviewerEmail"
                                                value={liveInterviewData.interviewerEmail}
                                                onChange={onHandleInputChangeLive}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent"
                                                placeholder="john@company.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Candidate Details Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Candidate Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Name *
                                            </Label>
                                            <Input
                                                type="text"
                                                name="candidateName"
                                                value={liveInterviewData.candidateName}
                                                onChange={onHandleInputChangeLive}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent"
                                                placeholder="Jane Doe"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </Label>
                                            <Input
                                                type="email"
                                                name="candidateEmail"
                                                value={liveInterviewData.candidateEmail}
                                                onChange={onHandleInputChangeLive}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent"
                                                placeholder="jane@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Interview Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                                            Position *
                                        </Label>
                                        <Input
                                            type="text"
                                            name="position"
                                            value={liveInterviewData.position}
                                            onChange={onHandleInputChangeLive}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent"
                                            placeholder="Senior Software Engineer"
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium text-gray-700 mb-2">
                                            Interview Type *
                                        </Label>
                                        <Select value={interviewType} onValueChange={setInterviewType}>
                                            <SelectTrigger className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent">
                                                <SelectValue placeholder="Technical Interview" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technical">Technical Interview</SelectItem>
                                                <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                                                <SelectItem value="system-design">System Design</SelectItem>
                                                <SelectItem value="coding">Coding Interview</SelectItem>
                                                <SelectItem value="hr">HR Round</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Scheduling Details Section */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Schedule Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Scheduled Time *
                                            </Label>
                                            <Input
                                                type="datetime-local"
                                                name="scheduledTime"
                                                value={liveInterviewData.scheduledTime}
                                                onChange={onHandleInputChangeLive}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Duration (minutes) *
                                            </Label>
                                            <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-transparent">
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="45">45 minutes</SelectItem>
                                                <SelectItem value="60">1 hour</SelectItem>
                                                <SelectItem value="90">1.5 hours</SelectItem>
                                                <SelectItem value="120">2 hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-800 border-gray-300"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={onHandleSubmitLive}
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Scheduling...
                                </>
                            ) : (
                                'Schedule Interview'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CreateIntDialog