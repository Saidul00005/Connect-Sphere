import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/employees/retrieve_by_user_id/${session.user.id}/`,
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
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    );
  }
}