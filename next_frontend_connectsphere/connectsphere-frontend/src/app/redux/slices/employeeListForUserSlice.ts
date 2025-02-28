import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  EmployeeState,
  FetchEmployeeParams,
  EmployeeResponse,
  PageData,
  getFilterKey,
} from "@/app/dashboard/collegues/types/employeeListTypes";
import { RootState } from "@/app/redux/store";

const MAX_PAGES = 10;

const initialState: EmployeeState = {
  pages: {},
  currentPage: {},
  loading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk<
  { filterKey: string; page: string; data: PageData },
  FetchEmployeeParams,
  { rejectValue: string; state: RootState }
>(
  "employees/fetch",
  async ({ pageUrl, department, search, component }, { getState, rejectWithValue }) => {
    try {
      const state = getState().employees;
      const filterKey = getFilterKey(department, search, component);
      const page = pageUrl
        ? new URL(pageUrl, window.location.origin).searchParams.get("page") || "1"
        : "1";

      if (state.pages[filterKey]?.[page]) {
        return {
          filterKey,
          page,
          data: state.pages[filterKey][page],
        };
      }

      const params = new URLSearchParams();
      params.set("page", page);
      if (department) params.set("department", department);
      if (search) params.set("search", search);

      const response = await axios.get<EmployeeResponse>(
        `/api/employees/list_employee_for_request_user/?${params.toString()}`
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
            : error.message || "Failed to fetch employees";
        return rejectWithValue(message);
      }
      return rejectWithValue("Failed to fetch employees");
    }
  }
);

const employeeListForUserSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    resetEmployees: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        const component = action.payload;
        const componentPrefix = `${component}_`;
        // Delete pages for the component
        Object.keys(state.pages).forEach(key => {
          if (key.startsWith(componentPrefix)) {
            delete state.pages[key];
          }
        });
        // Delete currentPage entries for the component
        Object.keys(state.currentPage).forEach(key => {
          if (key.startsWith(componentPrefix)) {
            delete state.currentPage[key];
          }
        });
      } else {
        // Existing behavior if no payload (reset all)
        state.pages = {};
        state.currentPage = {};
      }
    },
    setCurrentPage: (state, action: PayloadAction<Record<string, string>>) => {
      state.currentPage = { ...state.currentPage, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        const { filterKey, page, data } = action.payload;
        if (!state.pages[filterKey]) {
          state.pages[filterKey] = {};
          state.currentPage[filterKey] = "1";
        }

        state.pages[filterKey][page] = data;
        state.currentPage[filterKey] = page;

        const cachedPageKeys = Object.keys(state.pages[filterKey])
          .map(Number)
          .sort((a, b) => a - b);

        // If there are too many pages, find candidates that are not the current page.
        const currentPageNumber = Number(state.currentPage[filterKey]);
        const pagesToEvict = cachedPageKeys.filter((pageNum) => pageNum !== currentPageNumber);

        // Evict the oldest candidate until the number of cached pages is at most MAX_PAGES.
        while (Object.keys(state.pages[filterKey]).length > MAX_PAGES && pagesToEvict.length > 0) {
          const oldestPage = pagesToEvict.shift()?.toString();
          if (oldestPage) {
            delete state.pages[filterKey][oldestPage];
          }
        }
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "An error occurred";
      });
  },
});

export const { resetEmployees, setCurrentPage } = employeeListForUserSlice.actions;
export default employeeListForUserSlice.reducer;