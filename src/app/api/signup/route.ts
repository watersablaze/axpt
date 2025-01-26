import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';
import { signIn, signOut } from 'next-auth/react'; // Import signIn and signOut from NextAuth

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();
    console.log("Starting signup process...");

    // Ensure all fields are provided
    if (!name || !email || !password || !industry || !interests) {
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate wallet
    const wallet = Wallet.createRandom();
    const userSecretKey = process.env.USER_SECRET_KEY || 'default_secret_key';
    const encryptedWallet = encryptPrivateKey(wallet.privateKey, userSecretKey);

    // Clear any existing session before signing in the new user
    console.log("Clearing existing session...");
    await signOut({ redirect: false }); // Clear session without redirecting

    // Create user in the database
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

    console.log('User created successfully:', user);

    // Automatically log in the new user
    console.log("Signing in the new user...");
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: '/dashboard', // Redirect to the dashboard after signing in
    });

    return NextResponse.json({
      success: true,
      message: 'User created and signed in!',
      user,
    });
  } catch (error) {
    console.error("Error during signup:", error);

    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { success: false, message: 'Email is already in use' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Signup failed. Please try again later.' },
      { status: 500 }
    );
  }
}