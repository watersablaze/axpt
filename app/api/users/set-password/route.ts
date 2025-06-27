// app/api/users/set-password/route.ts
export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { handleSetPassword } from './handler';

export async function POST(req: NextRequest) {
  return handleSetPassword(req);
}