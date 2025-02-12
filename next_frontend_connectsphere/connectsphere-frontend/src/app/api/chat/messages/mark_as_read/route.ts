import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { room_id } = await req.json()

    if (!room_id) {
      return NextResponse.json({ error: "Missing room identifier" }, { status: 400 })
    }

    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/chat/messages/mark_as_read/`,
      { room_id },
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.BACKEND_API_KEY || '',
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
