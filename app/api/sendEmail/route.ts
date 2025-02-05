import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, text } = await request.json();

    // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // mail.proton.me
        port: parseInt(process.env.EMAIL_PORT || '465'), // Use 465 (SSL) or 587 (TLS)
        secure: process.env.EMAIL_PORT === '465', // true for SSL, false for TLS
        auth: {
          user: process.env.EMAIL_USER, // Your email address
          pass: process.env.EMAIL_PASS, // Your email password or app-specific password
        },
      });

    // Send email
    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`, // Sender address
      to, // Receiver's email
      subject, // Subject line
      text, // Plain text body
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}