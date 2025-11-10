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
import TimeRestriction from './_components/TimeRestriction';
// Real-time code editor will use Socket.io directly

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
];

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
    const [isConnected, setIsConnected] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [canJoin, setCanJoin] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const roomId = interviewLink;
    const isInitiatorRef = useRef(false);
    const hasReceivedOfferRef = useRef(false);
    const codeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

    // Initialize socket connection
    useEffect(() => {
        const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
            path: '/api/socket',
            transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            socketInstance.emit('join-room', roomId);
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [roomId]);

    // Handle real-time code synchronization via Socket.io
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleCodeChange = (data: { change: string; senderId: string }) => {
            if (data.senderId !== socket.id) {
                setCode(data.change);
            }
        };

        socket.on('code-change', handleCodeChange);

        return () => {
            socket.off('code-change', handleCodeChange);
        };
    }, [socket, isConnected]);

    // Initialize WebRTC
    useEffect(() => {
        if (!socket || !isConnected) return;

        let pc: RTCPeerConnection | null = null;
        let stream: MediaStream | null = null;

        const initWebRTC = async () => {
            try {
                // Get user media
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                localStreamRef.current = stream;
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Create peer connection with better ICE servers
                pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                    ],
                    iceCandidatePoolSize: 10
                });

                // Add local stream tracks
                stream.getTracks().forEach(track => {
                    if (pc) {
                        pc.addTrack(track, stream!);
                    }
                });

                // Handle remote stream
                pc.ontrack = (event) => {
                    console.log('Received remote track:', event.track.kind, event.streams.length);
                    if (event.streams && event.streams.length > 0) {
                        const remoteStream = event.streams[0];
                        setRemoteStream(remoteStream);
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.srcObject = remoteStream;
                            console.log('Remote stream set to video element');
                        }
                    }
                };

                // Handle ICE candidates
                pc.onicecandidate = (event) => {
                    if (event.candidate && socket) {
                        socket.emit('ice-candidate', {
                            candidate: event.candidate,
                            roomId: roomId
                        });
                    }
                };

                // Handle connection state changes
                pc.onconnectionstatechange = () => {
                    console.log('Connection state:', pc?.connectionState);
                    if (pc?.connectionState === 'failed') {
                        console.error('Peer connection failed');
                        toast.error('Connection failed. Please try again.');
                    }
                };

                peerConnectionRef.current = pc;

                // Process queued ICE candidates
                const processIceCandidateQueue = async () => {
                    if (!pc || iceCandidateQueueRef.current.length === 0) return;
                    
                    while (iceCandidateQueueRef.current.length > 0) {
                        const candidate = iceCandidateQueueRef.current.shift();
                        if (candidate) {
                            try {
                                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                                console.log('Processed queued ICE candidate');
                            } catch (error) {
                                console.error('Error processing queued ICE candidate:', error);
                            }
                        }
                    }
                };

                // Create offer function
                const createOffer = async () => {
                    if (!pc || !socket) return;
                    try {
                        console.log('Creating offer...');
                        const offer = await pc.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', {
                            offer: offer,
                            roomId: roomId
                        });
                        console.log('Offer sent');
                    } catch (error) {
                        console.error('Error creating offer:', error);
                        toast.error('Failed to create offer');
                    }
                };

                // Handle existing users (user joins and finds others already in room)
                const handleExistingUsers = () => {
                    console.log('Existing users found, creating offer');
                    // New user joining - they should create offer
                    setTimeout(() => {
                        if (!hasReceivedOfferRef.current && pc && pc.signalingState === 'stable') {
                            isInitiatorRef.current = true;
                            createOffer();
                        }
                    }, 1000);
                };

                // Handle user joined (another user joined the room)
                const handleUserJoined = (data: { userId: string; roomSize: number }) => {
                    console.log('User joined:', data);
                    // Someone else joined - if we haven't initiated yet and connection is stable, create offer
                    if (!hasReceivedOfferRef.current && !isInitiatorRef.current && pc && pc.signalingState === 'stable') {
                        setTimeout(() => {
                            if (!hasReceivedOfferRef.current && pc && pc.signalingState === 'stable') {
                                isInitiatorRef.current = true;
                                createOffer();
                            }
                        }, 1000);
                    }
                };

                // Handle offer
                const handleOffer = async (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
                    if (!pc || !socket || data.senderId === socket.id) return;
                    
                    // If we already have a connection established, ignore
                    if (pc.signalingState !== 'stable' && pc.remoteDescription) {
                        console.log('Already processing an offer, ignoring');
                        return;
                    }
                    
                    try {
                        console.log('Received offer from:', data.senderId);
                        hasReceivedOfferRef.current = true;
                        
                        // Set remote description
                        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                        console.log('Remote description set, signaling state:', pc.signalingState);
                        
                        // Process any queued ICE candidates
                        await processIceCandidateQueue();
                        
                        // Create and send answer
                        const answer = await pc.createAnswer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        await pc.setLocalDescription(answer);
                        console.log('Local description set, signaling state:', pc.signalingState);
                        
                        socket.emit('answer', {
                            answer: answer,
                            roomId: roomId
                        });
                        console.log('Answer sent to:', data.senderId);
                    } catch (error) {
                        console.error('Error handling offer:', error);
                        toast.error('Failed to handle offer');
                        hasReceivedOfferRef.current = false;
                    }
                };

                // Handle answer
                const handleAnswer = async (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
                    if (!pc || !socket || data.senderId === socket.id) return;
                    
                    // If we already have a remote description, ignore
                    if (pc.remoteDescription) {
                        console.log('Already have remote description, ignoring answer');
                        return;
                    }
                    
                    try {
                        console.log('Received answer from:', data.senderId);
                        const remoteDesc = new RTCSessionDescription(data.answer);
                        
                        if (pc.signalingState === 'have-local-offer') {
                            await pc.setRemoteDescription(remoteDesc);
                            console.log('Remote description set from answer, signaling state:', pc.signalingState);
                            
                            // Process any queued ICE candidates
                            await processIceCandidateQueue();
                        } else {
                            console.warn('Unexpected signaling state:', pc.signalingState, 'but setting remote description anyway');
                            // Try to set anyway
                            await pc.setRemoteDescription(remoteDesc);
                            
                            // Process any queued ICE candidates
                            await processIceCandidateQueue();
                        }
                    } catch (error) {
                        console.error('Error handling answer:', error);
                        toast.error('Failed to handle answer');
                    }
                };

                // Handle ICE candidate
                const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
                    if (!pc || !socket || data.senderId === socket.id) return;
                    
                    if (!data.candidate) return;
                    
                    try {
                        // If remote description is not set, queue the candidate
                        if (!pc.remoteDescription) {
                            console.log('Queuing ICE candidate (no remote description yet)');
                            iceCandidateQueueRef.current.push(data.candidate);
                        } else {
                            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                            console.log('Added ICE candidate');
                        }
                    } catch (error) {
                        console.error('Error handling ICE candidate:', error);
                        // Queue it for later if it failed
                        iceCandidateQueueRef.current.push(data.candidate);
                    }
                };

                // Set up socket event listeners
                socket.on('existing-users', handleExistingUsers);
                socket.on('user-joined', handleUserJoined);
                socket.on('offer', handleOffer);
                socket.on('answer', handleAnswer);
                socket.on('ice-candidate', handleIceCandidate);

                // Cleanup function
                return () => {
                    socket.off('existing-users', handleExistingUsers);
                    socket.off('user-joined', handleUserJoined);
                    socket.off('offer', handleOffer);
                    socket.off('answer', handleAnswer);
                    socket.off('ice-candidate', handleIceCandidate);
                };
            } catch (error) {
                console.error('Error initializing WebRTC:', error);
                toast.error('Failed to initialize video/audio. Please check your permissions.');
            }
        };

        initWebRTC();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
                setLocalStream(null);
            }

            if (pc) {
                pc.close();
                peerConnectionRef.current = null;
            }
        };
    }, [socket, roomId, isConnected]);

    // Handle code changes from Monaco Editor
    const handleCodeChange = (value: string | undefined) => {
        const newValue = value || '';
        
        // Update local state
        setCode(newValue);
        
        // Debounce and send to other participants
        if (codeUpdateTimeoutRef.current) {
            clearTimeout(codeUpdateTimeoutRef.current);
        }
        
        codeUpdateTimeoutRef.current = setTimeout(() => {
            if (socket && isConnected) {
                socket.emit('code-change', {
                    change: newValue,
                    roomId: roomId
                });
            }
        }, 300); // 300ms debounce
    };

    const toggleVideo = () => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOn(prev => !prev);
        }
    };

    const toggleAudio = () => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsAudioOn(prev => !prev);
        }
    };

    const endInterview = async () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (socket) {
            socket.disconnect();
        }
        if (codeUpdateTimeoutRef.current) {
            clearTimeout(codeUpdateTimeoutRef.current);
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
        if (interview && interview.status === 'scheduled' && localStreamRef.current) {
            updateStatus({
                interviewId: interview._id,
                status: 'ongoing',
                startedAt: Date.now()
            });
        }
    }, [interview, updateStatus]);

    // Check time-based access and auto-update status
    useEffect(() => {
        if (!interview) return;

        const checkTimeAccess = () => {
            const now = new Date();
            const scheduled = new Date(interview.scheduledTime);
            const endTime = new Date(scheduled.getTime() + interview.duration * 60000);

            // Check if interview has ended
            if (now > endTime && interview.status !== 'completed') {
                updateStatus({
                    interviewId: interview._id,
                    status: 'completed',
                    endedAt: Date.now()
                });
                setCanJoin(false);
                return;
            }

            // Check if it's time to join
            if (now >= scheduled && now <= endTime) {
                setCanJoin(true);
            } else {
                setCanJoin(false);
            }
        };

        checkTimeAccess();
        const interval = setInterval(checkTimeAccess, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [interview, updateStatus]);

    // Determine if user is interviewer
    useEffect(() => {
        if (interview && interview.interviewerEmail) {
            // You might want to check against the logged-in user's email
            // For now, we'll assume the first person to join is the interviewer
            setIsInterviewer(true);
        }
    }, [interview]);

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

    // Show time restriction if not allowed to join
    if (!canJoin) {
        return <TimeRestriction scheduledTime={interview.scheduledTime} duration={interview.duration} status={interview.status} />;
    }

  return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">{interview.position}</h1>
                    <p className="text-sm text-gray-400">
                        {interview.interviewType} • {interview.duration} minutes
                        {!isConnected && <span className="ml-2 text-red-400">• Disconnected</span>}
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
                            {!isVideoOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <VideoOff className="w-12 h-12 text-gray-600" />
                                </div>
                            )}
                        </div>
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <Video className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">Waiting for participant...</p>
                                    </div>
                                </div>
                            )}
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
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-sm border border-gray-500 focus:outline-none focus:border-purple-500"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                            <Monitor className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <MonacoEditor
                            height="100%"
                            language={selectedLanguage}
                            theme="vs-dark"
                            value={code}
                            onChange={handleCodeChange}
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
