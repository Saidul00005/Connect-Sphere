import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  ChatRoomState,
  FetchChatRoomsParams,
  ChatRoomResponse,
  ChatRoom
} from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes";
import { RootState } from "@/app/redux/store";

const initialState: ChatRoomState = {
  allRooms: [],
  nextPage: null,
  loading: false,
  error: null,
};

export const fetchChatRooms = createAsyncThunk<
  ChatRoomResponse,
  FetchChatRoomsParams,
  { rejectValue: string; state: RootState }
>(
  "chatRooms/fetch",
  async ({ pageUrl, search }, { rejectWithValue }) => {
    try {
      let url = pageUrl || '/api/chat/rooms/';

      if (!pageUrl) {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        url = `/api/chat/rooms/?${params.toString()}`;
      }

      const response = await axios.get<ChatRoomResponse>(url);
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
  ChatRoom,
  { name: string; type: string; participants: number[] },
  { rejectValue: string }
>(
  "chatRooms/create",
  async (chatRoomData, { rejectWithValue }) => {
    try {
      const response = await axios.post<ChatRoom>(
        "/api/chat/rooms/",
        chatRoomData
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || "Failed to create chat room");
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
      await axios.delete(`/api/chat/rooms/${roomId}`);
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
      state.nextPage = null;
    },
    // updateUnreadCount: (state, action: PayloadAction<number>) => {
    //   const room = state.allRooms.find(r => r.id === action.payload);
    //   if (room) {
    //     room.unread_messages_count = 0;
    //   }
    // }
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.allRooms = state.allRooms.map(room => {
        if (room.id === action.payload) {
          return { ...room, unread_messages_count: 0 };
        }
        return room;
      });
      state.nextPage = null;
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
        const { results, next } = action.payload;

        if (action.meta.arg.pageUrl) {
          state.allRooms = [...state.allRooms, ...results];
        } else {
          state.allRooms = results;
        }
        state.nextPage = next;
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
        state.allRooms.unshift(action.payload);
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
        state.allRooms = state.allRooms.filter(room => room.id !== action.payload);
      });
  },
});

export const { resetChatRooms, updateUnreadCount } = chatRoomsSliceForUser.actions;
export default chatRoomsSliceForUser.reducer;