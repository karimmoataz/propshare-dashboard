import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../app/api/auth/[...nextauth]/route';

export async function GET(_request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (session) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/api/auth/signout?callbackUrl=/login`,
        },
      });
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }