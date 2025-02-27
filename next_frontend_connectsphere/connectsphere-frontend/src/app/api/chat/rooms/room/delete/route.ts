import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  req: NextRequest
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roomId = req.nextUrl.searchParams.get('room_id')

    if (!roomId) {
      return NextResponse.json({ error: "Missing room_id" }, { status: 400 })
    }

    const response = await axios.delete(
      `${process.env.BACKEND_URL}/api/chat/rooms/${roomId}/delete/`,
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

