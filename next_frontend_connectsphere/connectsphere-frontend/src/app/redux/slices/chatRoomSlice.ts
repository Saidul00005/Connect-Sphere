import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
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
      const response = await axios.get(`/api/chat/rooms/singleChatRoomInformation/?roomId=${roomId}`);
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
      const response = await axios.post('/api/chat/rooms/addParticipants/', {
        room_id: roomId,
        user_ids: participants.map((p) => p.id),
      });

      if (response.data.message !== 'Participants added successfully') {
        throw new Error(response.data.error || 'Unexpected server response');
      }

      const state = getState() as { singleChatRoom: SingleChatRoomState };
      const existingRoom = state.singleChatRoom.rooms[roomId];

      if (existingRoom) {
        return { roomId, participants };
      } else {
        return {};
      }

    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: 'Failed to add participants' });
    }
  }
);

export const removeParticipant = createAsyncThunk(
  'chatRoom/removeParticipant',
  async (
    { roomId, userId }: { roomId: number; userId: number },
    { rejectWithValue }
  ) => {
    try {
      await axios.post(`/api/chat/rooms/room/removeParticipant/?room_id=${roomId}`, {
        user_id: userId
      });
      return { roomId, userId };
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: 'Failed to remove participant' });
    }
  }
);


const singleChatRoomSlice = createSlice({
  name: 'singleChatRoom',
  initialState,
  reducers: {
    socketAddParticipants: (state, action: PayloadAction<{ roomId: number, participants: User[] }>) => {
      const room = state.rooms[action.payload.roomId];
      if (room) {
        // const existingIds = new Set(room.participants.map((p: User) => p.id));
        // const newParticipants = action.payload.participants.filter((p: User) => !existingIds.has(p.id));
        // room.participants.push(...newParticipants);
        // // room.participants = [...room.participants, ...newParticipants];
        // // room.participants = [
        // //   ...room.participants,
        // //   ...action.payload.participants.filter(id =>
        // //     !room.participants.some(p => p.id === id))
        // // ]
        const room = state.rooms[action.payload.roomId];
        if (room) {
          const existingIds = new Set(room.participants.map(p => p.id));
          const newParticipants = action.payload.participants.filter(p =>
            !existingIds.has(p.id)
          );
          room.participants = [...room.participants, ...newParticipants];
        }
      }
    },
    socketRemoveParticipant: (state, action: PayloadAction<{ roomId: number, userId: number }>) => {
      const { roomId, userId } = action.payload;
      const room = state.rooms[roomId];
      if (room) {
        room.participants = room.participants.filter(p => p.id !== userId);
      }
    }
  },
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
        if (!action.payload.roomId || !action.payload.participants) return;
        const { roomId, participants } = action.payload;

        const room = state.rooms[roomId];

        if (room) {
          const existingIds = new Set(room.participants.map((p: User) => p.id));
          const newParticipants = participants.filter((p: User) => !existingIds.has(p.id));

          room.participants = [...room.participants, ...newParticipants];
        }
      })
      .addCase(removeParticipant.fulfilled, (state, action) => {
        const { roomId, userId } = action.payload;
        const room = state.rooms[roomId];

        if (room) {
          room.participants = room.participants.filter(
            (participant: User) => participant.id !== userId
          );
        }
      })
  },
});

export const { socketAddParticipants, socketRemoveParticipant } = singleChatRoomSlice.actions
export default singleChatRoomSlice.reducer;
