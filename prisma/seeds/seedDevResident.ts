import { prisma } from '@/infrastructure/db/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'resident@axpt.local'

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    console.log('✓ Dev resident already exists')
    return
  }

  const passwordHash = await bcrypt.hash('ChangeMeImmediately123!', 10)

  const user = await prisma.user.create({
    data: {
      email,
      username: 'resident',
      passwordHash,
      displayName: 'AXPT Resident',
      isAdmin: false,
      tier: 'resident',
    },
  })

  console.log('✓ Created dev resident:', user.email)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })