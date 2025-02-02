import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/accounts/users/${session.user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'X-Api-Key': process.env.BACKEND_API_KEY
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Profile API error:', error);

    const message = error?.response?.data?.error || error?.message || 'An unknown error occurred';
    const status = error?.response?.status || 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}