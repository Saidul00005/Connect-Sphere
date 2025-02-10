import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type {
  MessageResponse,
  ChatMessageState,
  FetchMessageParams,
} from "@/app/dashboard/chat/chat-history/types/chatMessagesTypes"
import { RootState } from "../store";

const initialState: ChatMessageState = {
  allMessages: [],
  nextCursor: null,
  loading: false,
  error: null,
}

export const fetchMessages = createAsyncThunk<
  MessageResponse,
  FetchMessageParams,
  { rejectValue: string; state: RootState }
>(
  "chatMessages/fetch",
  async ({ pageUrl, roomId }, { rejectWithValue }) => {
    try {
      let cursor = 'initial';
      if (pageUrl) {
        const url = new URL(pageUrl, window.location.origin);
        cursor = url.searchParams.get('cursor') || 'initial';
      }

      let url = pageUrl;
      if (!url) {
        url = `/api/chat/messages/?room_id=${roomId}`;
      }

      const response = await axios.get<MessageResponse>(url);

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          typeof error.response?.data?.error === "string"
            ? error.response?.data?.error
            : error.message || "Failed to fetch messages";
        return rejectWithValue(message);
      }
      return rejectWithValue("Failed to fetch messages");
    }
  }
);

export const sendMessage = createAsyncThunk<
  any,
  { content: string; roomId: string },
  { rejectValue: string }
>("chatMessages/send", async ({ content, roomId }, { rejectWithValue }) => {
  try {
    const response = await axios.post('/api/chat/sendMessage/', {
      room: parseInt(roomId),
      content
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || "Failed to send message");
    }
    return rejectWithValue("Failed to send message");
  }
});

export const editMessage = createAsyncThunk<
  { messageId: number; content: string },
  { messageId: number; content: string; roomId: string },
  { rejectValue: string }
>("chatMessages/edit", async ({ messageId, content, roomId }, { rejectWithValue }) => {
  try {
    await axios.patch(
      `/api/chat/messages/${messageId}?room_id=${roomId}`,
      { content }
    );
    return { messageId, content };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || "Failed to edit message");
    }
    return rejectWithValue("Failed to edit message");
  }
});

export const deleteMessage = createAsyncThunk<
  number,
  { messageId: number; roomId: string },
  { rejectValue: string }
>("chatMessages/delete", async ({ messageId, roomId }, { rejectWithValue }) => {
  try {
    await axios.delete(`/api/chat/messages/${messageId}?room_id=${roomId}`);
    return messageId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete message");
    }
    return rejectWithValue("Failed to delete message");
  }
});

const chatMessagesSlice = createSlice({
  name: "chatMessages",
  initialState,
  reducers: {
    resetMessages: (state) => {
      state.allMessages = []
      state.nextCursor = null
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false
        // Add new messages to the beginning of the array
        state.allMessages = [...action.payload.results, ...state.allMessages]
        state.nextCursor = action.payload.next
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "An error occurred"
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.allMessages.push(action.payload)
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const { messageId, content } = action.payload
        const message = state.allMessages.find((m) => m.id === messageId)
        if (message) {
          message.content = content
          message.is_modified = true
          message.last_modified_at = new Date().toISOString()
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload
        const message = state.allMessages.find((m) => m.id === messageId)
        if (message) {
          message.is_deleted = true
          message.content = "This message was deleted"
        }
      })
  },
})

export const { resetMessages } = chatMessagesSlice.actions
export default chatMessagesSlice.reducer
