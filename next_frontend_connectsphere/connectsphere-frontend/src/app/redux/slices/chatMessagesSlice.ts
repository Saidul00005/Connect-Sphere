import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  MessageResponse,
  PageData,
  ChatMessageState,
  FetchMessageParams,
} from "@/app/dashboard/chat/chat-history/types/chatMessagesTypes";
import { RootState } from "../store";

const MAX_PAGES = 10;

const initialState: ChatMessageState = {
  pages: {},
  currentPage: {},
  loading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk<
  { roomId: string; cursor: string; data: PageData },
  FetchMessageParams,
  { rejectValue: string; state: RootState }
>(
  "chatMessages/fetch",
  async ({ pageUrl, roomId }, { getState, rejectWithValue }) => {
    try {
      const state = getState().chatMessages;
      const filterKey = roomId;

      let cursor = 'initial';
      if (pageUrl) {
        const url = new URL(pageUrl, window.location.origin);
        cursor = url.searchParams.get('cursor') || 'initial';
      }

      if (state.pages[filterKey]?.[cursor]) {
        return {
          roomId: filterKey,
          cursor,
          data: state.pages[filterKey][cursor],
        };
      }

      let url = pageUrl;
      if (!url) {
        url = `/api/chat/messages/?room_id=${roomId}`;
      }

      const response = await axios.get<MessageResponse>(url);

      const data: PageData = {
        results: response.data.results,
        next: response.data.next,
        previous: response.data.previous,
      };

      return {
        roomId: filterKey,
        cursor,
        data,
      };
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
    const response = await axios.patch(
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
      state.pages = {};
      state.currentPage = {};
    },
    setCurrentPage: (state, action: PayloadAction<Record<string, string>>) => {
      state.currentPage = { ...state.currentPage, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { roomId, cursor, data } = action.payload;

        if (!state.pages[roomId]) {
          state.pages[roomId] = {};
          state.currentPage[roomId] = "initial";
        }

        state.pages[roomId][cursor] = data;
        state.currentPage[roomId] = cursor;

        // Manage page cache
        const cachedCursors = Object.keys(state.pages[roomId]);
        while (cachedCursors.length > MAX_PAGES) {
          // Remove the oldest cursor that isn't the current one
          const cursorsToEvict = cachedCursors.filter(c => c !== cursor);
          if (cursorsToEvict.length > 0) {
            delete state.pages[roomId][cursorsToEvict[0]];
            cachedCursors.splice(cachedCursors.indexOf(cursorsToEvict[0]), 1);
          }
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const roomId = action.meta.arg.roomId;
        const currentCursor = state.currentPage[roomId];

        if (state.pages[roomId]?.[currentCursor]) {
          state.pages[roomId][currentCursor].results.push({
            ...action.payload,
            is_sent: true,
            is_delivered: false,
            read_by: []
          });
        }
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const { messageId, content } = action.payload;
        Object.values(state.pages).forEach(pages => {
          Object.values(pages).forEach(page => {
            const message = page.results.find(m => m.id === messageId);
            if (message) {
              message.content = content;
              message.is_modified = true;
              message.last_modified_at = new Date().toISOString();
            }
          });
        });
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        Object.values(state.pages).forEach(pages => {
          Object.values(pages).forEach(page => {
            const message = page.results.find(m => m.id === messageId);
            if (message) {
              message.is_deleted = true;
              message.content = "This message was deleted";
            }
          });
        });
      })
  },
});

export const { resetMessages, setCurrentPage } = chatMessagesSlice.actions;
export default chatMessagesSlice.reducer;