import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

interface Employee {
  id: number
  user_id: number
  user__first_name: string | null
  user__last_name: string | null
  user__role__name: string
  department__name: string | null
}

interface EmployeeListState {
  employees: Employee[]
  loading: boolean
  error: string | null
  nextPage: string | null
  previousPage: string | null
  hasMore: boolean
}

const initialState: EmployeeListState = {
  employees: [],
  loading: false,
  error: null,
  nextPage: null,
  previousPage: null,
  hasMore: true,
}

export const fetchEmployees = createAsyncThunk(
  'employees/fetch',
  async (pageUrl: string | null, { rejectWithValue }) => {
    try {
      const url = '/api/employees/list_employee_for_request_user/';
      const response = await axios.get(url, { params: { pageUrl } });
      return response.data;
    } catch (error: any) {
      console.error('Fetch employees error:', error);
      return rejectWithValue(error.response?.data || { message: error.message || 'Unknown error' });
    }
  }
);

const employeeListForUserSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    resetEmployees(state) {
      state.employees = []
      state.nextPage = null
      state.previousPage = null
      state.hasMore = true
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        const { results, next, previous } = action.payload

        state.employees = [...state.employees, ...results]

        // if (state.employees.length > 30) {
        //   state.employees = state.employees.slice(10)
        // }

        state.nextPage = next
        state.previousPage = previous

        state.hasMore = !!next
        state.loading = false
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as { message: string })?.message || 'Failed to fetch employees'
      })
  }
})

export const { resetEmployees } = employeeListForUserSlice.actions
export default employeeListForUserSlice.reducer