import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type { ChatRoom, User } from '@/app/dashboard/chat/chat-history/types/chatHistoryTypes';

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

export const addParticipants = createAsyncThunk(
  'chatRoom/addParticipants',
  async ({
    roomId,
    participants
  }: {
    roomId: number;
    participants: User[]
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { singleChatRoom: SingleChatRoomState };
      const existingRoom = state.singleChatRoom.rooms[roomId];

      if (existingRoom) {
        return { roomId, participants, temporary: true };
      }

      const response = await axios.post('/api/chat/rooms/addParticipants', {
        room_id: roomId,
        user_ids: participants.map(p => p.id),
      });

      return { roomId, participants: response.data.added_participants };
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: 'Failed to add participants' });
    }
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
      })
      .addCase(addParticipants.fulfilled, (state, action) => {
        const { roomId, participants, temporary } = action.payload;

        const room = state.rooms[roomId];

        if (room) {
          const existingIds = new Set(room.participants.map((p: User) => p.id));
          const newParticipants = participants.filter((p: User) => !existingIds.has(p.id));

          if (temporary) {
            room.participants = [...room.participants, ...newParticipants];
          } else if (participants) {
            room.participants = [...room.participants, ...newParticipants];
          }
        }
      })
  },
});

export default singleChatRoomSlice.reducer;
