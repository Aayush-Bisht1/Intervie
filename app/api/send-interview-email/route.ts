import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        // Check if RESEND_API_KEY is configured
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Email service not configured', details: 'RESEND_API_KEY is missing' },
                { status: 500 }
            );
        }

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

        // Validate required fields
        if (!candidateEmail || !candidateName || !interviewLink || !scheduledTime || !position) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

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

        // Calculate end time
        const endTime = new Date(scheduledDate.getTime() + parseInt(duration) * 60000);
        const formattedEndTime = endTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });

        // Send email only to candidate
        const emailResult = await resend.emails.send({
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
                    <p><strong>End Time:</strong> ${formattedEndTime}</p>
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
                    <p style="margin-top: 20px; color: #666; font-size: 12px;">
                        <strong>Important:</strong> You can only join the interview between ${formattedDate} and ${formattedEndTime}. The interviewer will join from their dashboard.
                    </p>
                </div>
            `,
        });

        console.log('Email sent successfully:', emailResult);

        return NextResponse.json({ success: true, emailId: emailResult.id });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}