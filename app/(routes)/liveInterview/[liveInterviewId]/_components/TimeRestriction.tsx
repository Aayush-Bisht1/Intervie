"use client"
import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface TimeRestrictionProps {
    scheduledTime: string;
    duration: number;
    status: string;
}

export default function TimeRestriction({ scheduledTime, duration, status }: TimeRestrictionProps) {
    const router = useRouter();
    const [timeStatus, setTimeStatus] = React.useState<'before' | 'during' | 'after' | 'checking'>('checking');
    const [timeRemaining, setTimeRemaining] = React.useState<string>('');

    React.useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const scheduled = new Date(scheduledTime);
            const endTime = new Date(scheduled.getTime() + duration * 60000);

            if (now < scheduled) {
                // Before scheduled time
                const diff = scheduled.getTime() - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`${hours}h ${minutes}m`);
                setTimeStatus('before');
            } else if (now >= scheduled && now <= endTime) {
                // During interview time
                setTimeStatus('during');
            } else {
                // After end time
                setTimeStatus('after');
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [scheduledTime, duration]);

    if (timeStatus === 'checking') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4">Checking access...</p>
                </div>
            </div>
        );
    }

    if (timeStatus === 'before') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center text-white max-w-md p-8 bg-gray-800 rounded-lg">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                    <h2 className="text-2xl font-bold mb-4">Interview Not Started</h2>
                    <p className="text-gray-400 mb-2">The interview is scheduled to start at:</p>
                    <p className="text-xl font-semibold mb-4">
                        {new Date(scheduledTime).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <p className="text-gray-400 mb-4">Time remaining: <span className="text-purple-400 font-semibold">{timeRemaining}</span></p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-4">
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (timeStatus === 'after') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center text-white max-w-md p-8 bg-gray-800 rounded-lg">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold mb-4">Interview Ended</h2>
                    <p className="text-gray-400 mb-2">The interview has ended.</p>
                    <p className="text-gray-400 mb-4">
                        End time: {new Date(new Date(scheduledTime).getTime() + duration * 60000).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-4">
                        Go to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return null; // During interview time, allow access
}

