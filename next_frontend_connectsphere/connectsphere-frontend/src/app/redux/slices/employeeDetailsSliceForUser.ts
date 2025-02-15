import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export interface EmployeeDetails {
  employee_id: string | null;
  full_name: string | null;
  role_name: string | null;
  designation: string | null;
  reporting_manager_name: string | null;
  joining_date: string | '';
  performance_rating: number | null;
  department: string | null;
  contact_number: string | null;
  emergency_contact: string | null;
  skills: string[];
}

interface EmployeeState {
  details: Record<number, EmployeeDetails>;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  details: {},
  loading: false,
  error: null,
};

export const fetchEmployeePublicDetails = createAsyncThunk(
  'employeePublicDetails/fetchEmployeePublicDetails',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `/api/employees/public_details_of_employee_by_user_id?userId=${userId}`,
        { withCredentials: true }
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
      if (state.employee.details[userId]) {
        return false;
      }
      return true;
    },
  }
);

const MAX_PROFILE_DETAILS = 1;

const employeeDetailsSliceForUser = createSlice({
  name: 'employeePublicDetails',
  initialState: { ...initialState, detailsOrder: [] as number[] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeePublicDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeePublicDetails.fulfilled, (state, action) => {
        const { userId, details } = action.payload;

        if (state.detailsOrder.length >= MAX_PROFILE_DETAILS) {
          const oldestUserId = state.detailsOrder.shift(); // Remove the first added profile
          if (oldestUserId !== undefined) {
            delete state.details[oldestUserId];
          }
        }

        state.details[userId] = details;
        state.detailsOrder.push(userId);
        state.loading = false;
      })
      .addCase(fetchEmployeePublicDetails.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message: string })?.message ||
          'Failed to fetch employee details.....';
      });
  },
});

export default employeeDetailsSliceForUser.reducer;
