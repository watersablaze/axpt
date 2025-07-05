//import prisma from '@/lib/prisma';
//import bcrypt from 'bcryptjs';

//export async function validatePinLogin(email: string, pin: string) {
  //const user = await prisma.user.findUnique({ where: { email } });
//  if (!user || !user.password) return null;

//  const isValid = bcrypt.compareSync(pin, user.password);
//  return isValid ? user : null;
//}