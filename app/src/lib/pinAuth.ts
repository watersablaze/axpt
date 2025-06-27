// app/src/lib/pinAuth.ts
import redis from './redis';

const PIN_TTL_SECONDS = 300; // 5 minutes

export async function storePin(userId: string, pin: string): Promise<void> {
  await redis.set(`pin:${userId}`, pin, 'EX', PIN_TTL_SECONDS);
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const storedPin = await redis.get(`pin:${userId}`);
  return storedPin === pin;
}

export async function deletePin(userId: string): Promise<void> {
  await redis.del(`pin:${userId}`);
}