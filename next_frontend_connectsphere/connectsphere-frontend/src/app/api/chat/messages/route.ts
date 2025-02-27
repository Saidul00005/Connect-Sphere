import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cursor = req.nextUrl.searchParams.get('cursor')
    let url: string

    if (cursor) {
      url = `${process.env.BACKEND_URL}/api/chat/messages/?cursor=${cursor}`
    } else {
      const roomId = req.nextUrl.searchParams.get('room_id')
      if (!roomId) {
        return NextResponse.json({ error: "Missing room identifier" }, { status: 400 })
      }
      url = `${process.env.BACKEND_URL}/api/chat/messages/?room_id=${roomId}`
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${session.user.token}`,
        'X-Api-Key': process.env.BACKEND_API_KEY || ''
      }
    })

    const data = response.data;
    if (data.results && Array.isArray(data.results)) {
      data.results = data.results.slice().reverse();
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const response = await axios.post(
      `${process.env.BACKEND_URL}/api/chat/messages/`,
      body,
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
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
