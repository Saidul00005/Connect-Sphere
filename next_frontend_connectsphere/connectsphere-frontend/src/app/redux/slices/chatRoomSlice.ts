import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  ChatRoomState,
  FetchChatRoomsParams,
  ChatRoomResponse,
  PageData,
  getFilterKey,
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
      });
  },
});

export const { resetChatRooms, setCurrentPage } = chatRoomsSliceForUser.actions;
export default chatRoomsSliceForUser.reducer;