const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Add a sample user to the database
  const newUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: hashedPassword, // Save hashed password
      image: 'https://example.com/johndoe.png',
    },
  });

  console.log('New User:', newUser);

  // Fetch all users from the database
  const allUsers = await prisma.user.findMany();
  console.log('Users:', allUsers);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });