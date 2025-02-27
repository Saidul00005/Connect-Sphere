import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "Em ID is required" }, { status: 400 })
    }

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/employees/${userId}/get_employee_details/`,
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'X-Api-Key': process.env.BACKEND_API_Key
        }
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    )
  }
}
