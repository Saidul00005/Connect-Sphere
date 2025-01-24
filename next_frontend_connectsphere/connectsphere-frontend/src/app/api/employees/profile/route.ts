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
      `${process.env.BACKEND_URL}/api/employees/profile/`,
      {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    );
  }
}