import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.user.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const queryParams = new URLSearchParams({
      page,
      ...(department && { department }),
      ...(search && { search })
    }).toString();

    const backendUrl = `${process.env.BACKEND_URL}/api/employees/list_employee/?${queryParams}`;

    const response = await axios.get(backendUrl, {
      headers: {
        'Authorization': `Bearer ${session.user.token}`,
        'X-Api-Key': process.env.BACKEND_API_KEY || ''
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('List_Employee_For_Request_User API error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || "An unknown error occurred";
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}