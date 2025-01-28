import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    console.log("Starting signup process...");

    // Input validation
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

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate wallet
    const wallet = Wallet.createRandom();
    console.log(`Generated Wallet Address: ${wallet.address}`);

    // Encrypt private key
    const { encryptedData, iv } = encryptPrivateKey(wallet.privateKey);

    // Save the user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        industry,
        interests,
        walletAddress: wallet.address,
        encryptedPrivateKey: encryptedData,
        iv,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Signup successful!',
      user,
    });
  } catch (error: any) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      { success: false, message: 'Signup failed due to a server error.' },
      { status: 500 }
    );
  }
}