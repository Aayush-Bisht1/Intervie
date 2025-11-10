"use client"
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Monitor } from 'lucide-react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import TimeRestriction from './_components/TimeRestriction';

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

// Mirror controls: local mirrored selfie, remote true camera
const MIRROR_LOCAL = true;
const MIRROR_REMOTE = false;

function LiveInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewLink = params.liveInterviewId as string;

  const interview = useQuery(api.liveInterview.getLiveInterview, { interviewLink });
  const updateStatus = useMutation(api.liveInterview.updateInterviewStatus);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [code, setCode] = useState('// Start coding here...\n');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [canJoin, setCanJoin] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected'|'connecting'|'connected'>('disconnected');
  const [hasJoined, setHasJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const initLockRef = useRef(false);
  const roomId = interviewLink;
  const codeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Perfect Negotiation flags
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerRef = useRef(false);

  // Role handling
  const politeRef = useRef(false);       // stored role when known
  const roleKnownRef = useRef(false);    // have we locked the role yet?

  // Optional: show "End for all" for interviewer
  const isInterviewer = (interview as any)?.isInterviewer ?? true;

  // ---------- Time-based status (separate) ----------
  useEffect(() => {
    if (!interview || !hasJoined) return;
    const tick = async () => {
      const now = new Date();
      const start = new Date(interview.scheduledTime);
      const end = new Date(start.getTime() + interview.duration * 60000);
      if (now > end && interview.status !== 'completed') {
        await updateStatus({ interviewId: interview._id, status: 'completed', endedAt: Date.now() });
        toast.info('Interview time has ended');
        setTimeout(() => router.push('/dashboard'), 1200);
      }
    };
    tick();
    statusCheckIntervalRef.current = setInterval(tick, 30000);
    return () => { if (statusCheckIntervalRef.current) clearInterval(statusCheckIntervalRef.current); };
  }, [interview, updateStatus, router, hasJoined]);

  // ---------- Socket.io ----------
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      socketInstance.emit('join-room', roomId);
    });
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });
    socketInstance.on('connect_error', () => setConnectionStatus('disconnected'));

    socketRef.current = socketInstance;
    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, [roomId]);

  // ---------- Code sync ----------
  useEffect(() => {
    if (!socket) return;
    const handleCodeChange = (data: { change: string; senderId: string }) => {
      if (socket && data.senderId !== socket.id) setCode(data.change);
    };
    socket.on('code-change', handleCodeChange);
    return () => { socket.off('code-change', handleCodeChange); };
  }, [socket]);

  // Helper: compute polite role *for this message* if role not yet known
  const politeForSender = (senderId: string) => {
    const myId = socketRef.current?.id || '';
    if (!myId) return true; // safe default
    if (roleKnownRef.current) return politeRef.current;
    // Deterministic: lower ID is impolite; higher ID is polite
    const politeNow = myId > senderId;
    return politeNow;
  };

  // When we do learn the room composition, lock role so future messages use the same
  const lockRoleFromList = (others: string[]) => {
    const myId = socketRef.current?.id || '';
    if (!myId) return;
    const lowest = [...others, myId].sort()[0];
    politeRef.current = myId !== lowest; // lowest is impolite
    roleKnownRef.current = true;
    console.log('Role locked from list. polite=', politeRef.current);
  };

  const lockRoleFromJoin = (otherId: string) => {
    const myId = socketRef.current?.id || '';
    if (!myId) return;
    politeRef.current = myId > otherId;  // lower id is impolite
    roleKnownRef.current = true;
    console.log('Role locked from join. polite=', politeRef.current);
  };

  // ---------- WebRTC init ----------
  useEffect(() => {
    if (!socket || !isConnected || initLockRef.current) return;
    initLockRef.current = true;

    let cancelled = false;
    setRemoteStream(null);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
      iceCandidatePoolSize: 10,
    });
    peerConnectionRef.current = pc;
    setConnectionStatus('connecting');

    // Media
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        if (
          cancelled ||
          !peerConnectionRef.current ||
          peerConnectionRef.current !== pc ||
          pc.signalingState === 'closed'
        ) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        setLocalStream(stream);
        setHasJoined(true);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => {});
        }

        for (const track of stream.getTracks()) {
          if (cancelled || pc.connectionState === 'closed') break;
          pc.addTrack(track, stream);
        }

        const remoteMedia = new MediaStream();
        setRemoteStream(remoteMedia);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteMedia;
          remoteVideoRef.current.onloadedmetadata = () => {
            remoteVideoRef.current?.play().catch(() => {});
          };
        }
        pc.ontrack = (ev) => {
          if (!remoteMedia.getTracks().some(t => t.id === ev.track.id)) {
            remoteMedia.addTrack(ev.track);
          }
        };
      } catch (e) {
        console.error('getUserMedia error', e);
        setConnectionStatus('disconnected');
        toast.error('Could not access camera/microphone');
      }
    })();

    // Perfect Negotiation
    pc.onnegotiationneeded = async () => {
      try {
        // Don’t start offers until role determined (or we’ll create glare for no reason)
        if (!roleKnownRef.current) return;
        if (pc.signalingState !== 'stable') return;

        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { offer: pc.localDescription, roomId });
      } catch (e) {
        console.error('onnegotiationneeded error', e);
      } finally {
        makingOfferRef.current = false;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('ice-candidate', { candidate: event.candidate, roomId });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setConnectionStatus('connected');
      if (pc.connectionState === 'failed') {
        setConnectionStatus('disconnected');
        toast.error('Connection failed. Try rejoining.');
      }
    };

    // End-for-all signal
    socket.on('interview-ended', async () => {
      toast.info('Interview ended by interviewer');
      await endInterview();
    });

    // ---------- Signaling ----------
    const onExistingUsers = (data: { roomSize: number; existingUserIds?: string[] }) => {
      if (data?.existingUserIds && data.existingUserIds.length) {
        lockRoleFromList(data.existingUserIds);
      }
      console.log('existing-users', data);
    };

    const onUserJoined = (data: { userId: string; roomSize: number }) => {
      // If role not yet known, lock it immediately from the joining peer id
      if (!roleKnownRef.current && data?.userId) lockRoleFromJoin(data.userId);
      console.log('user-joined', data);
    };

    const drainQueuedIce = async (pcNow: RTCPeerConnection) => {
      while (iceCandidateQueueRef.current.length > 0 && pcNow.remoteDescription) {
        const c = iceCandidateQueueRef.current.shift();
        if (c) {
          try { await pcNow.addIceCandidate(new RTCIceCandidate(c)); }
          catch (e) { console.warn('Queued ICE add failed', e); }
        }
      }
    };

    const readyForOffer = () =>
      pc.signalingState === 'stable' ||
      (pc.signalingState === 'have-local-offer' && isSettingRemoteAnswerRef.current);

    const onOffer = async (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
      if (!socket || data.senderId === socket.id) return;
      const pcNow = peerConnectionRef.current!;
      // Decide polite for THIS message (works even if role wasn’t known before)
      const politeNow = politeForSender(data.senderId);
      if (!roleKnownRef.current) { politeRef.current = politeNow; roleKnownRef.current = true; }

      const offerCollision = makingOfferRef.current || !readyForOffer();

      ignoreOfferRef.current = !politeNow && offerCollision;
      if (ignoreOfferRef.current) {
        console.log('Ignoring offer due to collision (impolite peer).');
        return;
      }

      try {
        if (offerCollision && politeNow) {
          await Promise.all([
            pcNow.setLocalDescription({ type: 'rollback' } as any),
            pcNow.setRemoteDescription(new RTCSessionDescription(data.offer)),
          ]);
        } else {
          await pcNow.setRemoteDescription(new RTCSessionDescription(data.offer));
        }

        const answer = await pcNow.createAnswer();
        await pcNow.setLocalDescription(answer);
        socket.emit('answer', { answer: pcNow.localDescription, roomId });
        await drainQueuedIce(pcNow);
      } catch (e) {
        console.error('Error handling offer', e);
      } finally {
        ignoreOfferRef.current = false;
      }
    };

    const onAnswer = async (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
      if (!socket || data.senderId === socket.id) return;
      const pcNow = peerConnectionRef.current!;
      if (pcNow.signalingState !== 'have-local-offer') {
        console.log('Skipping answer because signalingState is', pcNow.signalingState);
        return;
      }
      if (isSettingRemoteAnswerRef.current) return;

      try {
        isSettingRemoteAnswerRef.current = true;
        await pcNow.setRemoteDescription(new RTCSessionDescription(data.answer));
        await drainQueuedIce(pcNow);
      } catch (e) {
        console.error('Error setting remote answer', e);
      } finally {
        isSettingRemoteAnswerRef.current = false;
      }
    };

    const onIceCandidate = async (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
      if (!socket || data.senderId === socket.id) return;
      const pcNow = peerConnectionRef.current!;
      try {
        if (!pcNow.remoteDescription) {
          iceCandidateQueueRef.current.push(data.candidate);
        } else {
          await pcNow.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    };

    socket.on('existing-users', onExistingUsers);
    socket.on('user-joined', onUserJoined);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice-candidate', onIceCandidate);

    return () => {
      cancelled = true;

      socket.off('existing-users', onExistingUsers);
      socket.off('user-joined', onUserJoined);
      socket.off('offer', onOffer);
      socket.off('answer', onAnswer);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('interview-ended');

      const pcNow = peerConnectionRef.current;
      if (pcNow) {
        try { pcNow.close(); } catch {}
        peerConnectionRef.current = null;
      }
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      setRemoteStream(null);

      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;

      initLockRef.current = false;
    };
  }, [socket, isConnected]);

  // ---------- Code editor change ----------
  const handleCodeChange = (value: string | undefined) => {
    const newValue = value || '';
    setCode(newValue);
    if (codeUpdateTimeoutRef.current) clearTimeout(codeUpdateTimeoutRef.current);
    codeUpdateTimeoutRef.current = setTimeout(() => {
      if (socket && isConnected) socket.emit('code-change', { change: newValue, roomId });
    }, 300);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOn(track.enabled);
    }
  };

  const toggleAudio = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioOn(track.enabled);
    }
  };

  const endInterview = async () => {
    try {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (socket) socket.disconnect();
      if (codeUpdateTimeoutRef.current) clearTimeout(codeUpdateTimeoutRef.current);
      if (interview?._id && hasJoined) {
        await updateStatus({ interviewId: interview._id, status: 'completed', endedAt: Date.now() });
      } else if (interview?._id && !hasJoined) {
        await updateStatus({ interviewId: interview._id, status: 'not-attended', endedAt: Date.now() });
      }
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    }
  };

  const endInterviewForAll = async () => {
    try {
      if (socket && socket.connected) socket.emit('end-interview', { roomId });
      await endInterview();
    } catch {
      await endInterview();
    }
  };

  // ---------- Time gate ----------
  useEffect(() => {
    if (!interview) return;
    const check = () => {
      const now = new Date();
      const start = new Date(interview.scheduledTime);
      const end = new Date(start.getTime() + interview.duration * 60000);
      if (now > end && interview.status !== 'completed') {
        setCanJoin(false);
        if (!hasJoined) updateStatus({ interviewId: interview._id, status: 'not-attended', endedAt: Date.now() });
        return;
      }
      setCanJoin(now >= start && now <= end);
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [interview, updateStatus, hasJoined]);

  if (!interview) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading interview...</p>
        </div>
      </div>
    );
  }

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
            {connectionStatus === 'connecting' && <span className="ml-2 text-yellow-400">• Connecting...</span>}
            {connectionStatus === 'disconnected' && <span className="ml-2 text-red-400">• Disconnected</span>}
            {connectionStatus === 'connected' && <span className="ml-2 text-green-400">• Connected</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={toggleVideo} variant="outline" size="sm" className={`${isVideoOn ? 'bg-gray-700' : 'bg-red-600'} border-gray-600 text-white hover:bg-gray-600`}>
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          <Button onClick={toggleAudio} variant="outline" size="sm" className={`${isAudioOn ? 'bg-gray-700' : 'bg-red-600'} border-gray-600 text-white hover:bg-gray-600`}>
            {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          <Button onClick={endInterview} variant="secondary" size="sm">
            <PhoneOff className="w-4 h-4 mr-2" /> Leave
          </Button>
          {isInterviewer && (
            <Button onClick={endInterviewForAll} variant="destructive" size="sm">
              <PhoneOff className="w-4 h-4 mr-2" /> End for all
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Video Section */}
        <div className="flex-1 bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
          {/* Local Video */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {localStream ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: MIRROR_LOCAL ? 'scaleX(-1)' : 'none' }}
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1 rounded text-sm font-medium">You {!isVideoOn && '(Video Off)'}</div>
                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <VideoOff className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="animate-pulse mb-3">
                    <Video className="w-12 h-12 text-gray-600 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm">Camera not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {remoteStream ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: MIRROR_REMOTE ? 'scaleX(-1)' : 'none' }}
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-3 py-1 rounded text-sm font-medium">Participant</div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="animate-pulse mb-3">
                    <Video className="w-12 h-12 text-gray-600 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm">Waiting for participant...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
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
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
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
              onChange={(value) => {
                const v = value || '';
                setCode(v);
                if (codeUpdateTimeoutRef.current) clearTimeout(codeUpdateTimeoutRef.current);
                codeUpdateTimeoutRef.current = setTimeout(() => {
                  if (socket && isConnected) socket.emit('code-change', { change: v, roomId });
                }, 300);
              }}
              options={{ minimap: { enabled: true }, fontSize: 14, wordWrap: 'on', automaticLayout: true }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveInterviewPage;
