import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type { ChatRoom } from '@/app/dashboard/chat/chat-history/types/chatHistoryTypes';

interface SingleChatRoomState {
  rooms: Record<number, ChatRoom>;
  order: number[];
  loading: boolean;
  error: string | null;
}

const initialState: SingleChatRoomState = {
  rooms: {},
  order: [],
  loading: false,
  error: null,
};

const MAX_CHATROOMS = 10;

export const fetchSingleChatRoom = createAsyncThunk(
  'chatRoom/fetchSingle',
  async (roomId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/chat/rooms/singleChatRoomInformation?roomId=${roomId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: 'An unknown error occurred' });
    }
  },
  {
    condition: (roomId, { getState }) => {
      const state = getState() as { singleChatRoom: SingleChatRoomState };
      if (state.singleChatRoom.rooms[roomId]) {
        return false;
      }
      return true;
    },
  }
);

const singleChatRoomSlice = createSlice({
  name: 'singleChatRoom',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSingleChatRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSingleChatRoom.fulfilled, (state, action) => {
        const room = action.payload as ChatRoom;

        // If we have already stored MAX_CHATROOMS, remove the oldest room.
        if (state.order.length >= MAX_CHATROOMS) {
          const oldestRoomId = state.order.shift();
          if (oldestRoomId !== undefined) {
            delete state.rooms[oldestRoomId];
          }
        }
        state.rooms[room.id] = room;
        state.order.push(room.id);
        state.loading = false;
      })
      .addCase(fetchSingleChatRoom.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message: string })?.message ||
          'Failed to fetch chat room details';
      });
  },
});

export default singleChatRoomSlice.reducer;
