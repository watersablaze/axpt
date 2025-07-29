// components/hooks/useLogout.ts

import { useRouter } from 'next/navigation';

export function useLogout() {
  const router = useRouter();

  return async function logoutAndRedirect() {
    try {
      const res = await fetch('/api/logout');
      if (res.ok) {
        // Optional: show animation or toast here
        router.push('/'); // Or /welcome, etc.
      } else {
        console.error('Logout failed.');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };
}