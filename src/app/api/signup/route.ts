import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    console.log("Starting signup process...");
    const { name, email, password, industry, interests } = await request.json();
    console.log("Received data:", { name, email, industry, interests });

    // Validation: Ensure required fields are provided
    if (!name || !email || !password || !industry || !interests) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    // Check if user exists
    console.log("Checking for existing user...");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
    console.log("User already exists.");
    return NextResponse.json(
      { success: false, message: 'User already exists' },
      { status: 400 }
    );
  }

  // Hash password
  console.log("Hashing password...");
  const hashedPassword = await bcrypt.hash(password, 8);

    // Generate wallet
    console.log("Creating wallet...");
    const wallet = Wallet.createRandom();

   // Encrypt wallet private key
   console.log("Encrypting private key...");
   const userSecretKey = process.env.USER_SECRET_KEY || 'default_secret_key';
   const encryptedWallet = encryptPrivateKey(wallet.privateKey, userSecretKey);


    // Save user to database
    console.log("Saving user to database...");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        industry,
        interests,
        walletAddress: wallet.address,
        encryptedPrivateKey: encryptedWallet.encryptedData,
        iv: encryptedWallet.iv,
      },
    });

    // Send welcome email
    console.log("Sending welcome email...");
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
      subject: 'Welcome to the Axis Point!',
      text: `Hi ${name},\n\nThank you for signing up! Your wallet address is ${wallet.address}.\n\nBest,\nThe Axis Point Team`,
    });

    console.log("Signup process complete.");
    return NextResponse.json({
      success: true,
      message: 'User created and email sent!',
      user,
    });
  } catch (error) {
    console.error("Error during signup:", error);

    // Handle specific errors like Prisma or Nodemailer errors
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { success: false, message: 'Email is already in use' },
        { status: 400 }
      );
    }

    // General error response
    return NextResponse.json(
      { success: false, message: 'Signup failed. Please try again later.' },
      { status: 500 }
    );
  }
}