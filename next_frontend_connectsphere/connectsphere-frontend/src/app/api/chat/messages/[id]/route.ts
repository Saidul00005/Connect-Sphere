import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    const roomId = req.nextUrl.searchParams.get('room_id')

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/chat/messages/${id}/?room_id=${roomId}`,
      {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          'Content-Type': 'application/json'
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    const { content } = await req.json()
    const roomId = req.nextUrl.searchParams.get('room_id')

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestBody = {
      room: Number(roomId),
      content: content
    }

    const response = await axios.put(
      `${process.env.BACKEND_URL}/api/chat/messages/${id}/?room_id=${roomId}`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          'Content-Type': 'application/json'
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    const roomId = req.nextUrl.searchParams.get('room_id')

    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const response = await axios.delete(
      `${process.env.BACKEND_URL}/api/chat/messages/${id}/?room_id=${roomId}`,
      {
        data: { room: roomId },
        headers: {
          Authorization: `Bearer ${session.user.token}`,
          'Content-Type': 'application/json'
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