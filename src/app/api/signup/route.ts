import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    console.log("Starting signup process...");

    // Input Validation
    if (!name || !email || !password || !industry || !interests) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simulate wallet creation (replace with actual logic if needed)
    const simulatedWallet = {
      address: '0xFakeWalletAddress',
      encryptedPrivateKey: 'fakeEncryptedPrivateKey',
      iv: 'fakeIV',
    };

    // Save the user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        industry,
        interests,
        walletAddress: simulatedWallet.address,
        encryptedPrivateKey: simulatedWallet.encryptedPrivateKey,
        iv: simulatedWallet.iv,
      },
    });

    console.log("User created successfully:", user);

    return NextResponse.json({
      success: true,
      message: 'Signup successful!',
      user,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      { success: false, message: 'Signup failed. Please try again later.' },
      { status: 500 }
    );
  }
}