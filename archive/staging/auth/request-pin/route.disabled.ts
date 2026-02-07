//export const runtime = 'nodejs';

//import { NextResponse } from 'next/server';
//import bcrypt from 'bcryptjs';
//import { z } from 'zod';
//import prisma from '@/lib/prisma';
//import { generateSecureToken } from '@/utils/secureToken';

//const schema = z.object({
 // email: z.string().email(),
 // name: z.string().min(2),
 // pin: z.string().min(4).max(8),
//  tier: z.string().optional(),
//  partnerSlug: z.string().optional(),
//});

//export async function handler(req: Request) {
 // try {
   // const body = await req.json();
 //  const parsed = schema.safeParse(body);
  //  if (!parsed.success) {
  //    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
  //  }

  //  const { email, name, pin, tier, partnerSlug } = parsed.data;
  //  const hashed = await bcrypt.hash(pin, 10);

    // ⏱️ Secure token generation
   // const { raw, hash } = generateSecureToken();

    // Create or update PIN Login Request
   // await prisma.pinLoginRequest.upsert({
  //    where: { email },
//      update: {
 //       pinHash: hashed,
    //    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
   //   },
      create: {
   //     email,
  //      pinHash: hashed,
 //       expiresAt: new Date(Date.now() + 15 * 60 * 1000),
 //    },
 //   });

    // Create or update user with secure accessToken
  //  await prisma.user.upsert({
    //  where: { email },
    //  update: {
       // accessTokenHash: hash,
  //      accessTokenIssuedAt: new Date(),
   //   },
     // create: {
      //  email,
     //   name,
     //   username: email.split('@')[0],
       // password: hashed,
      //  accessTokenHash: hash,
     //   accessTokenIssuedAt: new Date(),
       // tier,
       // partnerSlug,
   //   },
   // });

    // 🎟️ Set session cookie
  //  const response = NextResponse.json({ success: true });
  //  response.headers.set(
 //     'Set-Cookie',
 //     `axpt_session=${raw}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` // 7 days
 //   );

//    return response;
//  } catch (err) {
   // console.error('[AXPT::request-pin]', err);
   // return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
 // }
}