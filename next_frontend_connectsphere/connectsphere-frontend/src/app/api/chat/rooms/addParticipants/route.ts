import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const backendUrl = `${process.env.BACKEND_URL}/api/chat/rooms/add_participants/`;

    const response = await axios.post(backendUrl, body, {
      headers: {
        'Authorization': `Bearer ${session.user.token}`,
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.BACKEND_API_KEY || '',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Add participants API error:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || 'An unknown error occurred';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}