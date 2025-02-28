import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const response = await axios.get(
      `${process.env.BACKEND_URL}/api/employees/public_details_of_employee_by_user_id/${userId}/`,
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'X-Api-Key': process.env.BACKEND_API_KEY
        }
      }
    )

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Employee Public details API error:', error)
    return NextResponse.json(
      { error: error.response?.data?.error || error.message },
      { status: error.response?.status || 500 }
    )
  }
}
