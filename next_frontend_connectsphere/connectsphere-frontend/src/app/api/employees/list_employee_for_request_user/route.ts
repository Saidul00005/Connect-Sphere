import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pageUrl = searchParams.get("pageUrl");
    const finalPageUrl = pageUrl ? pageUrl : '/api/employees/list_employee/?page=1';


    const response = await axios.get(
      `${process.env.BACKEND_URL}${finalPageUrl}`,
      {
        headers: {
          'Authorization': `Bearer ${session.user.token}`,
          'X-Api-Key': process.env.BACKEND_API_KEY
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('List_Employee_For_Request_User API error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || "An unknown error occurred" },
      { status: error.response?.status || 500 }
    );
  }
}