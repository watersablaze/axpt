import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { Wallet } from 'ethers';
import { encryptPrivateKey } from '@/utils/crypto-utils';

export async function POST(request: Request) {
  try {
    const { name, email, password, industry, interests } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const wallet = Wallet.createRandom();
    const userSecretKey = process.env.USER_SECRET_KEY || 'default_secret_key';
    const encryptedWallet = encryptPrivateKey(wallet.privateKey, userSecretKey);

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

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Axis Point" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Axis Point!',
      text: `Hi ${name},\n\nThank you for signing up! Your wallet address is ${wallet.address}.\n\nBest,\nThe Axis Point Team`,
    });

    return NextResponse.json({ success: true, message: 'User created and email sent!', user });
  } catch (error) {
    console.error('Error during signup:', (error as Error).message || error);
    return NextResponse.json({ success: false, message: 'Signup failed.' }, { status: 500 });
  }
}