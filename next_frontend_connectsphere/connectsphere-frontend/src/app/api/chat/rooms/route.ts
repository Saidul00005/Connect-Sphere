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

    // const searchParams = request.nextUrl.searchParams;
    // const cursor = searchParams.get('cursor');
    // const search = searchParams.get('search');

    // const baseUrl = `${process.env.BACKEND_URL}/api/chat/rooms/`;

    // const url = new URL(baseUrl);

    // if (cursor) url.searchParams.set('cursor', cursor);
    // if (search) url.searchParams.set('search', search);

    const response = await axios.get(`${process.env.BACKEND_URL}/api/chat/rooms/`, {
      headers: {
        'Authorization': `Bearer ${session.user.token}`,
        'X-Api-Key': process.env.BACKEND_API_KEY || ''
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Chat Rooms API error:', error);

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !session.user.token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.type || !Array.isArray(body.participants)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (body.type === "GROUP" && !body.name) {
      return NextResponse.json(
        { error: "Name is required for group chat" },
        { status: 400 }
      );
    }

    const backendUrl = `${process.env.BACKEND_URL}/api/chat/rooms/`;

    const requestBody = {
      ...body,
      name: body.type === "DIRECT" ? null : body.name,
    };

    const response = await axios.post(backendUrl, requestBody, {
      headers: {
        "Authorization": `Bearer ${session.user.token}`,
        "X-Api-Key": process.env.BACKEND_API_KEY || "",
        "Content-Type": "application/json",
      },
      validateStatus: () => true,
    });

    if (response.status === 201) {
      return NextResponse.json(
        {
          success: true,
          message: "Chatroom created successfully.",
          chatroom: response.data,
        },
        { status: 201 }
      );
    }

    if (response.status === 200) {
      if (response.data.message === "Chatroom restored successfully.") {
        return NextResponse.json(
          {
            success: true,
            message: "Chatroom restored successfully.",
            chatroom: response.data,
          },
          { status: 200 }
        );
      }

      if (response.data.message === "Chatroom already exists.") {
        return NextResponse.json(
          {
            success: true,
            message: "Chatroom already exists.",
            chatroom: response.data,
          },
          { status: 200 }
        );
      }
    }
    return NextResponse.json(response.data, { status: response.status });
  } catch (error: any) {
    console.error("Create Chat Room API error:", error);
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage =
        error.response?.data?.error || error.message || "An unknown error occurred";
      return NextResponse.json(
        { error: errorMessage },
        { status }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}