import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import type {
  Message,
  MessageResponse,
  ChatMessageState,
  FetchMessageParams,
} from "@/app/dashboard/chat/chat-history/types/chatMessagesTypes"
import type {
  User
} from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes"
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
  Message,
  { content: string; roomId: string },
  { rejectValue: string }
>("chatMessages/send", async ({ content, roomId }, { rejectWithValue }) => {
  try {
    const response = await axios.post('/api/chat/sendMessage/', {
      room: parseInt(roomId),
      content
    });
    return response.data
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
      `/api/chat/messages/message/edit?message_id=${messageId}&room_id=${roomId}`,
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
    await axios.delete(`/api/chat/messages/message/delete?message_id=${messageId}&room_id=${roomId}`);
    return messageId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || "Failed to delete message");
    }
    return rejectWithValue("Failed to delete message");
  }
});


export const markMessagesAsRead = createAsyncThunk<
  void,
  { roomId: number; user: User },
  { rejectValue: string; state: RootState }
>(
  "chatMessages/markAsRead",
  async ({ roomId, user }, { rejectWithValue, dispatch }) => {
    try {
      await axios.post("/api/chat/messages/mark_as_read", { room_id: roomId });

      dispatch(markMessagesRead({ roomId, user }));

    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || "Failed to mark messages as read");
      }
      return rejectWithValue("Failed to mark messages as read");
    }
  }
);

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
    markMessagesRead: (state, action: PayloadAction<{ roomId: number; user: User }>) => {
      state.allMessages = state.allMessages.map(message => {
        if (message.room === action.payload.roomId &&
          !message.read_by?.some(u => u.id === action.payload.user.id)) {
          return {
            ...message,
            read_by: [...(message.read_by || []), action.payload.user]
          };
        }
        return message;
      });
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const newMessage = action.payload;

      if (!state.allMessages.some(m => m.id === newMessage.id && m.room === newMessage.room)) {
        state.allMessages.push({ ...newMessage, read_by: newMessage.read_by || [] });
      }
    },
    deleteMessageSuccess: (state, action: PayloadAction<Message>) => {
      const deletedMessage = action.payload
      const message = state.allMessages.find((m) => m.id === deletedMessage.id && m.room === deletedMessage.room)
      if (message) {
        message.is_deleted = true
        message.content = "This message was deleted"
      }
    },
    socketMarkMessagesRead: (state, action: PayloadAction<{ roomId: number; user: User }>) => {
      state.allMessages = state.allMessages.map(message => {
        if (message.room === action.payload.roomId &&
          !message.read_by?.some(u => u.id === action.payload.user.id)) {
          return {
            ...message,
            read_by: [...(message.read_by || []), action.payload.user]
          };
        }
        return message;
      });
    },
    socketEditMessage: (state, action: PayloadAction<Message>) => {
      const editedMessage = action.payload;
      const index = state.allMessages.findIndex(m =>
        m.id === editedMessage.id &&
        m.room === editedMessage.room
      );

      if (index !== -1) {
        state.allMessages[index] = {
          ...editedMessage,
          is_modified: true,
          last_modified_at: new Date().toISOString()
        };
      }
    }
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
        state.allMessages.push({
          ...action.payload,
          read_by: action.payload.read_by || []
        });
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

export const { resetMessages, markMessagesRead, addMessage, deleteMessageSuccess, socketMarkMessagesRead, socketEditMessage } = chatMessagesSlice.actions
export default chatMessagesSlice.reducer
