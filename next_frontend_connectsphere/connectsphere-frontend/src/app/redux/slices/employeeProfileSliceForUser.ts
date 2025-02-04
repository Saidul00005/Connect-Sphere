// src/app/redux/slices/employeeProfileSliceForUser.ts

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export interface EmployeeDetails {
  employee_id: string | null;
  name: string | null;
  role: string | null;
  designation: string | null;
  reporting_manager: string | null;
  joining_date: string | '';
  performance_rating: number | null;
  last_review_date: string | '';
  department: string | null;
  contact_number: string | null;
  emergency_contact: string | null;
  address: string | null;
  skills: string[];
}

interface EmployeeState {
  profiles: Record<number, EmployeeDetails>;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  profiles: {},
  loading: false,
  error: null,
};

export const fetchEmployeeDetails = createAsyncThunk(
  'employee/fetchDetails',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/employees/get_employee_details_for_user/`,
        { userId }
      );
      return { userId, details: response.data };
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: 'An unknown error occurred' });
    }
  },
  {
    condition: (userId, { getState }) => {
      const state = getState() as { employee: EmployeeState };
      if (state.employee.profiles[userId]) {
        return false;
      }
      return true;
    },
  }
);

const employeeProfileSliceForUser = createSlice({
  name: 'employee',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDetails.fulfilled, (state, action) => {
        const { userId, details } = action.payload;
        state.profiles[userId] = details;
        state.loading = false;
      })
      .addCase(fetchEmployeeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message: string })?.message ||
          'Failed to fetch employee details';
      });
  },
});

export default employeeProfileSliceForUser.reducer;
