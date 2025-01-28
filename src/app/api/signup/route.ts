import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    console.log("Starting signup process...");

    console.log('Loaded USER_SECRET_KEY:', process.env.USER_SECRET_KEY?.length, 'bytes');

    // Input validation
    if (!name || !email || !password || !industry || !interests) {
      console.warn("Validation failed: Missing required fields.");
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn(`Signup failed: User with email ${email} already exists.`);
      return NextResponse.json(
        { success: false, message: 'User already exists.' },
        { status: 400 }
      );
    }

    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed successfully.");
    } catch (hashError) {
      console.error("Error hashing password:", hashError);
      return NextResponse.json(
        { success: false, message: 'Failed to process password. Please try again later.' },
        { status: 500 }
      );
    }

    // Generate wallet
    const wallet = Wallet.createRandom();
    console.log(`Generated Wallet Address: ${wallet.address}`);

    // Encrypt private key
    let encryptedWallet;
    try {
      encryptedWallet = encryptPrivateKey(wallet.privateKey);
      console.log("Private key encrypted successfully.");
    } catch (encryptionError) {
      console.error("Error encrypting wallet private key:", encryptionError);
      return NextResponse.json(
        { success: false, message: 'Failed to create wallet. Please try again later.' },
        { status: 500 }
      );
    }

    // Save the user in the database
    let user;
    try {
      user = await prisma.user.create({
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
      console.log("User created successfully:", user);
    } catch (dbError) {
      console.error("Database error while creating user:", dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to save user. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signup successful!',
      user,
    });
  } catch (error: any) {
    console.error('Unexpected error during signup:', error);
    return NextResponse.json(
      { success: false, message: 'Signup failed due to a server error.' },
      { status: 500 }
    );
  }
}