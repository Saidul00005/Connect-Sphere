import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  EmployeeState,
  FetchEmployeeParams,
  EmployeeResponse,
  getFilterKey
} from '@/app/dashboard/collegues/types/employeeListTypes';
import { RootState } from "@/app/redux/store";

const initialState: EmployeeState = {
  pages: {},
  currentPage: {},
  nextPage: {},
  previousPage: {},
  totalCount: {},
  totalPages: {},
  loading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk<
  { filterKey: string; page: string; data: EmployeeResponse },
  FetchEmployeeParams,
  { rejectValue: string, state: RootState }
>(
  "employees/fetch",
  async ({ pageUrl, department, search }, { getState, rejectWithValue }) => {
    try {
      const state = getState().employees;

      const filterKey = getFilterKey(department, search);
      const page = pageUrl
        ? new URL(pageUrl, window.location.origin).searchParams.get("page") || "1"
        : "1";

      if (state.pages[filterKey]?.[page]) {
        return {
          filterKey,
          page,
          data: {
            results: state.pages[filterKey][page],
            count: state.totalCount[filterKey],
            next: state.nextPage[filterKey],
            previous: state.previousPage[filterKey]
          }
        };
      }

      const params = new URLSearchParams();

      // if (pageUrl) {
      //   const urlObj = new URL(pageUrl, window.location.origin);
      //   params.set('page', urlObj.searchParams.get('page') || '1');
      // } else {
      //   params.set('page', '1');
      // }

      // if (department) params.set('department', department);
      // if (search) params.set('search', search);

      params.set("page", page);
      if (department) params.set("department", department);
      if (search) params.set("search", search);

      const response = await axios.get<EmployeeResponse>(
        `/api/employees/list_employee_for_request_user?${params.toString()}`
      );

      return {
        filterKey: getFilterKey(department, search),
        page: params.get('page') || '1',
        data: response.data
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch employees"
        );
      }
      return rejectWithValue("Failed to fetch employees");
    }
  }
);

const employeeListForUserSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    resetEmployees: (state) => {
      state.pages = {};
      state.currentPage = {};
      state.nextPage = {};
      state.previousPage = {};
      state.totalCount = {};
      state.totalPages = {};
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
        const pageSize = 1;

        if (!state.pages[filterKey]) {
          state.pages[filterKey] = {};
          state.currentPage[filterKey] = "1";
          state.totalCount[filterKey] = 0;
          state.totalPages[filterKey] = 0;
        }

        state.pages[filterKey][page] = data.results;
        state.currentPage[filterKey] = page;
        state.totalCount[filterKey] = data.count;
        state.totalPages[filterKey] = Math.ceil(data.count / pageSize);
        state.nextPage[filterKey] = data.next;
        state.previousPage[filterKey] = data.previous;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      });
  }
});

export const { resetEmployees, setCurrentPage } = employeeListForUserSlice.actions;
export default employeeListForUserSlice.reducer;