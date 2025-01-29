import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    console.log("✅ Starting signup process...");

    // Validate required fields
    if (!name || !email || !password || !industry || !interests) {
      console.warn("⚠️ Missing required fields.");
      return NextResponse.json(
        { success: false, message: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Validate encryption key
    const userSecretKey = process.env.USER_SECRET_KEY;
    if (!userSecretKey || Buffer.from(userSecretKey, 'hex').length !== 32) {
      console.error("❌ Invalid USER_SECRET_KEY: Ensure it is a 64-character hexadecimal string (32 bytes).");
      return NextResponse.json(
        { success: false, message: 'Server configuration error. Please try again later.' },
        { status: 500 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.warn(`⚠️ User already exists: ${email}`);
      return NextResponse.json(
        { success: false, message: 'User already exists.' },
        { status: 400 }
      );
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashed successfully.");

    // Generate new wallet
    const wallet = Wallet.createRandom();
    console.log(`🛠️ Wallet created. Address: ${wallet.address}`);

    // Encrypt the private key
    const encryptedWallet = encryptPrivateKey(wallet.privateKey);
    console.log("🔒 Wallet private key encrypted.");

    // Save user in database
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

    console.log("✅ User created successfully:", user.email);

    return NextResponse.json({
      success: true,
      message: 'Signup successful!',
      user,
    });
  } catch (error: unknown) {
    console.error("❌ Unexpected error during signup:", error);
    return NextResponse.json(
      { success: false, message: 'Signup failed due to a server error.' },
      { status: 500 }
    );
  }
}