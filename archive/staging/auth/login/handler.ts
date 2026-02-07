// FILE: app/api/auth/login/handler.ts
// TEMPORARILY DISABLED FOR CLEAN DEPLOYMENT

// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import bcrypt from 'bcryptjs';
// import { createSessionCookie } from '@/lib/auth/session';

// export async function handler(req: Request) {
//   const { email, password } = await req.json();

//   const user = await prisma.user.findUnique({ where: { email } });
//   if (!user || !bcrypt.compareSync(password, user.password)) {
//     return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
//   }

//   const res = NextResponse.json({ message: 'Login successful', userId: user.id });

//   // ✅ Secure cookie logic
//   const sessionCookie = await createSessionCookie({
//     userId: user.id,
//     name: user.name ?? undefined,
//     tier: user.tier,
//   });

//   return res;
// }