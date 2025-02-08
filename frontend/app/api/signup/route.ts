import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Wallet } from "ethers";
import { encryptPrivateKey } from "../../utils/crypto-utils";

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    if (!name || !email || !password || !industry || !interests) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create custodial wallet (generated & controlled by platform)
    const wallet = Wallet.createRandom();
    const { encryptedData, iv } = encryptPrivateKey(wallet.privateKey);

    // Store user with custodial wallet
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
      message: "Signup successful!",
      user: { email: user.email, walletAddress: user.walletAddress },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, message: "Signup failed due to a server error." },
      { status: 500 }
    );
  }
}