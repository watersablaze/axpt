import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    console.log('Received data:', { name, email, password, industry, interests }); // Log input

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, industry, interests },
    });

    console.log('User created successfully:', user);

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

    console.log('Welcome email sent successfully');
    return NextResponse.json({ success: true, message: 'User created and email sent!', user });
  } catch (error) {
    console.error('Error during signup:', error.message || error);
    return NextResponse.json(
      { success: false, message: 'Signup failed. Please check server logs for details.' },
      { status: 500 }
    );
  }
}