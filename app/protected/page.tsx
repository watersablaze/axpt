import { getServerSession } from 'next-auth';
import authOptions from "@/app/api/auth/authOptions";
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login'); // Redirect to login if not authenticated
  }

  return (
    <div>
      <h1>Welcome, {session?.user?.name || 'User'}</h1>
      <p>This is a protected page!</p>
    </div>
  );
}