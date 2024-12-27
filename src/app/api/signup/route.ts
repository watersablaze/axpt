import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Send welcome email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Axis Point" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Axis Point!',
      text: `Hi ${name},\n\nThank you for signing up! We're thrilled to have you on board.\n\nBest,\nThe Axis Point Team`,
    });

    return NextResponse.json({ success: true, message: 'User created and email sent!', user });
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { success: false, message: 'Signup failed' },
      { status: 500 }
    );
  }
}