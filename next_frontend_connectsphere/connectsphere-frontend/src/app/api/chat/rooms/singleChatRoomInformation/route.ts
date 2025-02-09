import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roomId = request.nextUrl.searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is missing' }, { status: 400 });
    }
    const backendUrl = `${process.env.BACKEND_URL}/api/chat/rooms/${roomId}/`;

    const response = await axios.get(backendUrl, {
      headers: {
        'Authorization': `Bearer ${session.user.token}`,
        'X-Api-Key': process.env.BACKEND_API_KEY || '',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Single Chat Room API error:', error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.error || error.message || 'An unknown error occurred';
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}