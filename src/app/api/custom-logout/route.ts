// app/api/custom-logout/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the session cookie and any other auth cookies
  const cookieStore = await cookies();
  
  // Clear the next-auth.session-token cookie
  cookieStore.delete('next-auth.session-token');
  
  // Clear the next-auth.csrf-token cookie
  cookieStore.delete('next-auth.csrf-token');
  
  // Clear the next-auth.callback-url cookie
  cookieStore.delete('next-auth.callback-url');
  
  // Return success response
  return NextResponse.json({ success: true });
}