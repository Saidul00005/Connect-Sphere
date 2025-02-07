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
  { roomId: string; page: string; data: PageData },
  FetchMessageParams,
  { rejectValue: string; state: RootState }
>(
  "chatMessages/fetch",
  async ({ pageUrl, roomId }, { getState, rejectWithValue }) => {
    try {
      const state = getState().chatMessages;
      const filterKey = roomId;
      const page = pageUrl
        ? new URL(pageUrl, window.location.origin).searchParams.get("page") || "1"
        : "1";

      if (state.pages[filterKey]?.[page]) {
        return {
          roomId: filterKey,
          page,
          data: state.pages[filterKey][page],
        };
      }

      const params = new URLSearchParams();
      params.set("page", page);
      params.set("room", roomId);

      const response = await axios.get<MessageResponse>(
        `/api/chat/messages/?${params.toString()}`
      );

      const data: PageData = {
        results: response.data.results,
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count,
      };

      return {
        roomId: filterKey,
        page: params.get("page") || "1",
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

const chatMessagesSliceForUser = createSlice({
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
        const { roomId, page, data } = action.payload;

        if (!state.pages[roomId]) {
          state.pages[roomId] = {};
          state.currentPage[roomId] = "1";
        }

        state.pages[roomId][page] = data;
        state.currentPage[roomId] = page;

        const cachedPageKeys = Object.keys(state.pages[roomId])
          .map(Number)
          .sort((a, b) => a - b);

        const currentPageNumber = Number(state.currentPage[roomId]);
        const pagesToEvict = cachedPageKeys.filter((pageNum) => pageNum !== currentPageNumber);

        while (
          Object.keys(state.pages[roomId]).length > MAX_PAGES &&
          pagesToEvict.length > 0
        ) {
          const oldestPage = pagesToEvict.shift()?.toString();
          if (oldestPage) {
            delete state.pages[roomId][oldestPage];
          }
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const roomId = action.meta.arg.roomId;
        const currentPageNumber = state.currentPage[roomId];

        if (state.pages[roomId]?.[currentPageNumber]) {
          state.pages[roomId][currentPageNumber].results.push({
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

export const { resetMessages, setCurrentPage } = chatMessagesSliceForUser.actions;
export default chatMessagesSliceForUser.reducer;
