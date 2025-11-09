"use client"
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor } from 'lucide-react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function LiveInterviewPage() {
    const params = useParams();
    const interviewLink = params.liveInterviewId as string;
    
    const interview = useQuery(api.liveInterview.getLiveInterview, { 
        interviewLink: interviewLink 
    });
    const updateStatus = useMutation(api.liveInterview.updateInterviewStatus);

    const [socket, setSocket] = useState<Socket | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [code, setCode] = useState('// Start coding here...\n');
    const [isInterviewer, setIsInterviewer] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const roomId = interviewLink;

    // Initialize socket connection
    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
            path: '/api/socket',
        });

        socketInstance.on('connect', () => {
            console.log('Connected to server');
            socketInstance.emit('join-room', roomId);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [roomId]);

    // Initialize WebRTC
    useEffect(() => {
        if (!socket) return;

        const initWebRTC = async () => {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Create peer connection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            // Add local stream tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle remote stream
            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        candidate: event.candidate,
                        roomId: roomId
                    });
                }
            };

            peerConnectionRef.current = pc;

            // Check if we're the first user (interviewer)
            socket.on('user-joined', (userId: string) => {
                if (socket.id !== userId) {
                    setIsInterviewer(true);
                    createOffer();
                }
            });

            // Handle offer
            socket.on('offer', async (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
                if (data.senderId !== socket.id) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('answer', {
                        answer: answer,
                        roomId: roomId
                    });
                }
            });

            // Handle answer
            socket.on('answer', async (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
                if (data.senderId !== socket.id) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                }
            });

            // Handle ICE candidate
            socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
                if (data.senderId !== socket.id) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            });
        };

        initWebRTC();

        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
        };
    }, [socket, roomId]);

    const createOffer = async () => {
        if (!peerConnectionRef.current) return;
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socket?.emit('offer', {
            offer: offer,
            roomId: roomId
        });
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOn(!isVideoOn);
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioOn(!isAudioOn);
        }
    };

    const endInterview = async () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (socket) {
            socket.disconnect();
        }
        if (interview?._id) {
            await updateStatus({
                interviewId: interview._id,
                status: 'completed',
                endedAt: Date.now()
            });
        }
        window.location.href = '/dashboard';
    };

    // Update status when interview starts
    useEffect(() => {
        if (interview && interview.status === 'scheduled' && localStream) {
            updateStatus({
                interviewId: interview._id,
                status: 'ongoing',
                startedAt: Date.now()
            });
        }
    }, [interview, localStream]);

    if (!interview) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading interview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">{interview.position}</h1>
                    <p className="text-sm text-gray-400">
                        {interview.interviewType} • {interview.duration} minutes
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={toggleVideo}
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                        {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    <Button
                        onClick={toggleAudio}
                        variant="outline"
                        size="sm"
                        className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                    >
                        {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <Button
                        onClick={endInterview}
                        variant="destructive"
                        size="sm"
                    >
                        <PhoneOff className="w-4 h-4 mr-2" />
                        End Interview
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 p-4">
                {/* Video Section */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                                You
                            </div>
                        </div>
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                                {isInterviewer ? interview.candidateName : interview.interviewerName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Code Editor Section */}
                <div className="w-1/2 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-700 px-4 py-2 flex justify-between items-center">
                        <h2 className="font-semibold">Code Editor</h2>
                        <Monitor className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <MonacoEditor
                            height="100%"
                            defaultLanguage="javascript"
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                wordWrap: 'on',
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LiveInterviewPage;