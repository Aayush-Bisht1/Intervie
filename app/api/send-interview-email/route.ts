import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            interviewerEmail, 
            interviewerName,
            candidateEmail, 
            candidateName, 
            interviewLink, 
            scheduledTime, 
            position,
            duration,
            interviewType 
        } = body;

        // Format scheduled time
        const scheduledDate = new Date(scheduledTime);
        const formattedDate = scheduledDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        // Send email to candidate
        await resend.emails.send({
            from: 'Intervie <onboarding@resend.dev>', // Update with your verified domain
            to: candidateEmail,
            subject: `Interview Scheduled: ${position}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Interview Scheduled</h2>
                    <p>Hello ${candidateName},</p>
                    <p>Your interview for the position of <strong>${position}</strong> has been scheduled.</p>
                    <p><strong>Interview Type:</strong> ${interviewType}</p>
                    <p><strong>Scheduled Time:</strong> ${formattedDate}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p><strong>Interviewer:</strong> ${interviewerName}</p>
                    <p style="margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/liveInterview/${interviewLink}" 
                           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Join Interview
                        </a>
                    </p>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        Or copy this link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/liveInterview/${interviewLink}
                    </p>
                </div>
            `,
        });

        // Send email to interviewer
        await resend.emails.send({
            from: 'Intervie <onboarding@resend.dev>', // Update with your verified domain
            to: interviewerEmail,
            subject: `Interview Scheduled: ${position} - ${candidateName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Interview Scheduled</h2>
                    <p>Hello ${interviewerName},</p>
                    <p>You have scheduled an interview with <strong>${candidateName}</strong> for the position of <strong>${position}</strong>.</p>
                    <p><strong>Interview Type:</strong> ${interviewType}</p>
                    <p><strong>Scheduled Time:</strong> ${formattedDate}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p style="margin-top: 30px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/liveInterview/${interviewLink}" 
                           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Join Interview
                        </a>
                    </p>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        Or copy this link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/liveInterview/${interviewLink}
                    </p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}