import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await axios.delete(
      `${process.env.BACKEND_URL}/api/chat/rooms/${id}/delete/`,
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'X-Api-Key': process.env.BACKEND_API_KEY || ''
        }
      }
    )

    return NextResponse.json(
      { message: "Chat room deleted successfully" },
      { status: response.status }
    )
  } catch (error: any) {
    console.error('Delete chat room error:', error)
    return NextResponse.json(
      { error: error.response?.data?.error || "Failed to delete chat room" },
      { status: error.response?.status || 500 }
    )
  }
}

interface RemoveParticipantRequest {
  user_id: number
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const { user_id: userId } = await req.json() as RemoveParticipantRequest;

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/chat/rooms/${id}/remove_participant/`,
      { user_id: userId },
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'X-Api-Key': process.env.BACKEND_API_KEY || '',
          'Content-Type': 'application/json'
        }
      }
    );

    return NextResponse.json(
      { message: "Participant removed successfully" },
      { status: response.status }
    );
  } catch (error: any) {
    console.error('Remove participant error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || "Failed to remove participant" },
      { status: error.response?.status || 500 }
    );
  }
}