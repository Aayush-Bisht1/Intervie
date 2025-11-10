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

        // YOU NEED TO VERIFY YOUR DOMAIN IN RESEND FIRST!
        // For now, use your verified email address as the 'from' address
        // Replace 'onboarding@resend.dev' with your verified domain email
        const fromEmail = 'no-reply@intervie.com'; // Change this to your verified domain

        // Send email only to candidate
        const emailResult = await resend.emails.send({
            from: fromEmail,
            to: candidateEmail,
            subject: `Interview Scheduled: ${position}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">Interview Scheduled</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #374151;">Hello <strong>${candidateName}</strong>,</p>
                        <p style="font-size: 16px; color: #374151;">Your interview for the position of <strong style="color: #7c3aed;">${position}</strong> has been scheduled.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Interview Type:</td>
                                    <td style="padding: 10px 0; color: #111827; text-transform: capitalize;">${interviewType}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Start Time:</td>
                                    <td style="padding: 10px 0; color: #111827;">${formattedDate}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">End Time:</td>
                                    <td style="padding: 10px 0; color: #111827;">${formattedEndTime}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Duration:</td>
                                    <td style="padding: 10px 0; color: #111827;">${duration} minutes</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Interviewer:</td>
                                    <td style="padding: 10px 0; color: #111827;">${interviewerName}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/liveInterview/${interviewLink}" 
                               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                Join Interview
                            </a>
                        </div>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                <strong>⚠️ Important:</strong> You can only join the interview between the start and end times shown above. Please ensure you have a stable internet connection and working camera/microphone.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                If the button doesn't work, copy and paste this link:
                            </p>
                            <p style="color: #7c3aed; font-size: 14px; word-break: break-all; margin: 10px 0;">
                                ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/liveInterview/${interviewLink}
                            </p>
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px;">
                            <p style="color: #1e40af; font-size: 13px; margin: 0;">
                                <strong>💡 Tip:</strong> Join 5 minutes early to test your audio and video setup.
                            </p>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                        <p style="margin: 0;">This is an automated message from Intervie</p>
                        <p style="margin: 5px 0;">Please do not reply to this email</p>
                    </div>
                </div>
            `,
        });

        console.log('Email sent successfully:', emailResult);

        return NextResponse.json({ success: true, emailId: emailResult.data?.id });
    } catch (error: any) {
        console.error('Error sending email:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}