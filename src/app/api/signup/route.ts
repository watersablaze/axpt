import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    console.log("✅ Starting signup process...");

    const { name, email, password, industry, interests } = await request.json();
    console.log("📥 Received user input:", { name, email, industry, interests });

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
    console.log("🔑 USER_SECRET_KEY loaded successfully.");

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

    // Generate new Ethereum wallet
    const wallet = Wallet.createRandom();
    console.log(`🛠️ Wallet created. Address: ${wallet.address}`);

    // Encrypt the private key
    const encryptedWallet = encryptPrivateKey(wallet.privateKey);
    console.log("🔒 Wallet private key encrypted.");

    // Save user in the database
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

    console.log(`✅ User created successfully: ${user.email}`);

    // ✅ Return success response (Handle sign-in on the frontend)
    return NextResponse.json({
      success: true,
      message: 'Signup successful! Redirecting...',
      user: { email: user.email, walletAddress: user.walletAddress },
    });

  } catch (error: unknown) {
    console.error("❌ Unexpected error during signup:", error);
    return NextResponse.json(
      { success: false, message: 'Signup failed due to a server error.' },
      { status: 500 }
    );
  }
}