import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear the user's authentication token or session here.
    // For example, you might delete the token from the client-side cookies or remove the session.

    return NextResponse.json({ message: 'Logout successful' });
  } catch (error: any) {
    console.error('Error in logout route:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}