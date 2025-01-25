import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

interface Message {
  id: number
  room: number
  sender: number
  content: string
  timestamp: string
  is_deleted: boolean
  shared_with: number[]
}

interface ChatRoom {
  id: number
  name: string
  type: string
  created_by: number
  participants: number[]
  created_at: string
  is_active: boolean
}

interface ChatState {
  rooms: ChatRoom[]
  messages: Message[]
  loading: boolean
  error: string | null
}

const initialState: ChatState = {
  rooms: [],
  messages: [],
  loading: false,
  error: null
}

export const fetchChatRooms = createAsyncThunk(
  'chat/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/chat/rooms')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const createChatRoom = createAsyncThunk(
  'chat/createRoom',
  async (roomData: { name: string; type: string; participants: number[] }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/chat/rooms', roomData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Participant actions
export const addParticipant = createAsyncThunk(
  'chat/addParticipant',
  async ({ roomId, userId }: { roomId: number; userId: number }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/chat/participants', { room_id: roomId, user_id: userId })
      return { roomId, userId }
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Message actions
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (roomId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/chat/messages?room_id=${roomId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const createMessage = createAsyncThunk(
  'chat/createMessage',
  async ({ roomId, content }: { roomId: number; content: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/chat/messages', { room: roomId, content })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const updateMessage = createAsyncThunk(
  'chat/updateMessage',
  async ({ messageId, roomId, content }: { messageId: number; roomId: number; content: string }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `/api/chat/messages/${messageId}?room_id=${roomId}`,
        { room: roomId, content }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
)

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ messageId, roomId }: { messageId: number; roomId: number }, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/chat/messages/${messageId}?room_id=${roomId}`, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      return { messageId, roomId }
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Existing room reducers
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.rooms = action.payload
        state.loading = false
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || 'Failed to fetch rooms'
      })
      .addCase(createChatRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.rooms.push(action.payload)
        state.loading = false
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || 'Failed to create room'
      })

      // Participant reducers
      .addCase(addParticipant.fulfilled, (state, action) => {
        const room = state.rooms.find(r => r.id === action.payload.roomId)
        if (room && !room.participants.includes(action.payload.userId)) {
          room.participants.push(action.payload.userId)
        }
      })

      // Message reducers
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload
        state.loading = false
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || 'Failed to fetch messages'
      })
      .addCase(createMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload)
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex(m => m.id === action.payload.id)
        if (index !== -1) {
          state.messages[index] = action.payload
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(m =>
          m.id !== action.payload.messageId || m.room !== action.payload.roomId
        )
      })
  }
})

export default chatSlice.reducer