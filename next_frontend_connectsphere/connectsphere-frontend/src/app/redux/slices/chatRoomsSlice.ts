import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  ChatRoomState,
  ChatRoomResponse,
  ChatRoom,
  Message
} from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes";
import type { User } from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes"
import { RootState } from "@/app/redux/store";

const initialState: ChatRoomState = {
  allRooms: [],
  displayedCount: 10,
  loading: false,
  error: null,
};

interface CreateChatRoomParams {
  name?: string;
  type: 'DIRECT' | 'GROUP';
  participants: number[];
  otherParticipantName?: string;
}

export interface CreateChatRoomResponse {
  success: boolean;
  message: string;
  chatroom: ChatRoom;
}

export const fetchChatRooms = createAsyncThunk<
  ChatRoomResponse,
  void,
  { rejectValue: string; state: RootState }
>(
  "chatRooms/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<ChatRoomResponse>(`/api/chat/rooms/`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || "Failed to fetch chat rooms");
      }
      return rejectWithValue("Failed to fetch chat rooms");
    }
  }
);

export const createChatRoom = createAsyncThunk<
  CreateChatRoomResponse,
  CreateChatRoomParams,
  { rejectValue: string }
>(
  "chatRooms/create",
  async (chatRoomData, { rejectWithValue }) => {
    try {
      const requestBody = {
        type: chatRoomData.type,
        participants: chatRoomData.participants,
        name: chatRoomData.type === "DIRECT" ? null : chatRoomData.name,
      };

      const response = await axios.post<CreateChatRoomResponse>(
        "/api/chat/rooms/",
        requestBody
      );

      if (chatRoomData.type === 'DIRECT' && chatRoomData.otherParticipantName) {
        return {
          ...response.data,
          name: chatRoomData.otherParticipantName
        };
      }


      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.error || "Failed to create chat room"
        );
      }
      return rejectWithValue("Failed to create chat room");
    }
  }
);

export const deleteChatRoom = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "chatRooms/delete",
  async (roomId, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/chat/rooms/room/delete?room_id=${roomId}`);
      return roomId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw rejectWithValue(error.response?.data?.error || "Failed to delete chat room");
      }
      throw rejectWithValue("Failed to delete chat room");
    }
  }
);

const chatRoomsSliceForUser = createSlice({
  name: "chatRooms",
  initialState,
  reducers: {
    resetChatRooms: (state) => {
      state.allRooms = [];
    },
    socketDeleteRoom: (state, action: PayloadAction<number>) => {
      state.allRooms = state.allRooms.filter(room => room.id !== action.payload);
    },
    socketAddRoom: (state, action: PayloadAction<ChatRoom>) => {
      const exists = state.allRooms.some(room => room.id === Number(action.payload.id));
      if (!exists) {
        state.allRooms.unshift(action.payload);
      }
    },
    socketUpdateLastMessage: (
      state,
      action: PayloadAction<{ roomId: number; message: Message, userId: number }>
    ) => {
      const roomIndex = state.allRooms.findIndex(r => r.id === action.payload.roomId);
      if (roomIndex === -1) return;

      const updatedRoom = {
        ...state.allRooms[roomIndex],
        last_message: action.payload.message
      };

      const isUnread = !action.payload.message.read_by.some(u => u.id === action.payload.userId);

      state.allRooms = isUnread
        ? [
          updatedRoom,
          ...state.allRooms.slice(0, roomIndex),
          ...state.allRooms.slice(roomIndex + 1)
        ]
        : state.allRooms.map((room, idx) =>
          idx === roomIndex ? updatedRoom : room
        );
    },
    socketEditLastMessage: (
      state,
      action: PayloadAction<{ roomId: number; message: Message }>
    ) => {
      const room = state.allRooms.find((r) => r.id === action.payload.roomId);
      if (room && room.last_message?.id === action.payload.message.id) {
        room.last_message.content = action.payload.message.content;
      }
    },
    socketDeleteLastMessage: (
      state,
      action: PayloadAction<{ roomId: number; messageId: number }>
    ) => {
      const room = state.allRooms.find((r) => r.id === action.payload.roomId);
      if (room && room.last_message?.id === action.payload.messageId) {
        room.last_message.content = "This message was deleted";
      }
    },
    socketMarkLastMessageRead: (
      state,
      action: PayloadAction<{ roomId: number; user: User }>
    ) => {
      const room = state.allRooms.find(r => r.id === action.payload.roomId);
      if (room?.last_message) {
        const exists = room.last_message.read_by.some(
          u => u.id === action.payload.user.id
        );
        if (!exists) {
          room.last_message.read_by = [
            ...room.last_message.read_by,
            action.payload.user
          ];
        }
      }
    },
    promoteUnreadRoom: (state, action: PayloadAction<{ roomId: number, userId: number }>) => {
      const roomId = action.payload.roomId;
      const currentUserId = action.payload.userId;

      const roomIndex = state.allRooms.findIndex(room => room.id === roomId);
      if (roomIndex === -1) return;

      const room = state.allRooms[roomIndex];
      const isUnread = room.last_message &&
        !room.last_message.read_by.some(user => user.id === currentUserId);

      if (isUnread) {
        state.allRooms = [
          room,
          ...state.allRooms.slice(0, roomIndex),
          ...state.allRooms.slice(roomIndex + 1)
        ];
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms = action.payload.results;
        state.displayedCount = 10;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch rooms";
      })
      .addCase(createChatRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms.unshift(action.payload.chatroom);
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create chat room";
      })
      .addCase(deleteChatRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteChatRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.allRooms = state.allRooms.filter(room => room.id !== action.payload);
      })
      .addCase(deleteChatRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete chat room";
      });
  },
});

export const { resetChatRooms, socketDeleteRoom, socketAddRoom, socketUpdateLastMessage, socketEditLastMessage, socketDeleteLastMessage, socketMarkLastMessageRead, promoteUnreadRoom } = chatRoomsSliceForUser.actions;
export default chatRoomsSliceForUser.reducer;