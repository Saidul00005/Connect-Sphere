import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  ChatRoomState,
  FetchChatRoomsParams,
  ChatRoomResponse,
  PageData,
  getFilterKey,
  ChatRoom
} from "@/app/dashboard/chat/chat-history/types/chatHistoryTypes";
import { RootState } from "@/app/redux/store";

const MAX_PAGES = 10;

const initialState: ChatRoomState = {
  pages: {},
  currentPage: {},
  loading: false,
  error: null,
};

export const fetchChatRooms = createAsyncThunk<
  { filterKey: string; page: string; data: PageData },
  FetchChatRoomsParams,
  { rejectValue: string; state: RootState }
>(
  "chatRooms/fetch",
  async ({ pageUrl, search }, { getState, rejectWithValue }) => {
    try {
      const state = getState().chatRooms;
      const filterKey = getFilterKey(search);
      const page = pageUrl
        ? new URL(pageUrl, window.location.origin).searchParams.get("page") || "1"
        : "1";

      // Check if we already have this page in cache
      if (state.pages[filterKey]?.[page]) {
        return {
          filterKey,
          page,
          data: state.pages[filterKey][page],
        };
      }

      const params = new URLSearchParams();
      params.set("page", page);
      if (search) params.set("search", search);

      const response = await axios.get<ChatRoomResponse>(
        `/api/chat/rooms/?${params.toString()}`
      );

      const data: PageData = {
        results: response.data.results,
        next: response.data.next,
        previous: response.data.previous,
        count: response.data.count,
      };

      return {
        filterKey,
        page: params.get("page") || "1",
        data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          typeof error.response?.data?.error === "string"
            ? error.response?.data?.error
            : error.message || "Failed to fetch chat rooms";
        return rejectWithValue(message);
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
      state.pages = {};
      state.currentPage = {};
    },
    setCurrentPage: (state, action: PayloadAction<Record<string, string>>) => {
      state.currentPage = { ...state.currentPage, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        const { filterKey, page, data } = action.payload;

        if (!state.pages[filterKey]) {
          state.pages[filterKey] = {};
          state.currentPage[filterKey] = "1";
        }

        state.pages[filterKey][page] = data;
        state.currentPage[filterKey] = page;

        // Manage cache size
        const cachedPageKeys = Object.keys(state.pages[filterKey])
          .map(Number)
          .sort((a, b) => a - b);

        const currentPageNumber = Number(state.currentPage[filterKey]);
        const pagesToEvict = cachedPageKeys.filter(
          (pageNum) => pageNum !== currentPageNumber
        );

        while (
          Object.keys(state.pages[filterKey]).length > MAX_PAGES &&
          pagesToEvict.length > 0
        ) {
          const oldestPage = pagesToEvict.shift()?.toString();
          if (oldestPage) {
            delete state.pages[filterKey][oldestPage];
          }
        }
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "An error occurred";
      })
      .addCase(createChatRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.loading = false;
        const newChatRoom = action.payload;

        // Optionally, you could add it to the cache, depending on the context
        const filterKey = getFilterKey("");  // This could depend on search or filters
        if (!state.pages[filterKey]) {
          state.pages[filterKey] = {};
        }

        // Assuming the new chat room should appear on page 1 or the active page
        const currentPage = state.currentPage[filterKey] || "1";
        if (!state.pages[filterKey][currentPage]) {
          state.pages[filterKey][currentPage] = { results: [], next: null, previous: null, count: 0 };
        }

        // Add the new chat room to the current page's results
        state.pages[filterKey][currentPage].results.push(newChatRoom);
        state.pages[filterKey][currentPage].count += 1;
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
        const deletedRoomId = action.payload;

        // Update all pages that might contain the deleted room
        Object.keys(state.pages).forEach(filterKey => {
          Object.keys(state.pages[filterKey]).forEach(pageKey => {
            const page = state.pages[filterKey][pageKey];

            // Remove the deleted room from results
            const initialLength = page.results.length;
            page.results = page.results.filter(room => room.id !== deletedRoomId);

            // Update count if room was removed
            if (page.results.length < initialLength) {
              page.count = Math.max(0, (page.count || 0) - 1);
            }
          });
        });
      })
      .addCase(deleteChatRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete chat room";
      });
  },
});

export const { resetChatRooms, setCurrentPage } = chatRoomsSliceForUser.actions;
export default chatRoomsSliceForUser.reducer;