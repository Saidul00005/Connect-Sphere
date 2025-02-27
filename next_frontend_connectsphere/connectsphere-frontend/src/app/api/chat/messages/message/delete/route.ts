import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const messageId = req.nextUrl.searchParams.get('message_id')
    const roomId = req.nextUrl.searchParams.get('room_id')


    if (!messageId) {
      return NextResponse.json({ error: "Missing message_id" }, { status: 400 })
    }

    if (!roomId) {
      return NextResponse.json({ error: "Missing room_id" }, { status: 400 })
    }

    const requestBody = {
      room: Number(roomId),
    }

    const response = await axios.delete(
      `${process.env.BACKEND_URL}/api/chat/messages/${messageId}/delete/`,
      {
        data: requestBody,
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.BACKEND_API_KEY || ''
        }
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    )
  }
}