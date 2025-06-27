import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/jwt';
import { createWalletForUser } from '@/lib/wallet';
import crypto from 'crypto'; // 🧠 was missing in original

export async function handler(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
      data: {
        username: name.toLowerCase().replace(/\s+/g, '-'),
        email,
        password: hashed,
        name,
        accessToken: crypto.randomUUID(), // 🔐 secure ID
      },
    });

    const token = signJwt({ id: user.id, email: user.email });

    // ✅ Wallet creation for new user
    await createWalletForUser(user.id);

    return NextResponse.json({ token });
  } catch (err) {
    console.error('[AXPT::signup]', err);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}