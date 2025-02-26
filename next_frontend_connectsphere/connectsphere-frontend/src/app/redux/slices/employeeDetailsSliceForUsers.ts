import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export interface EmployeeDetails {
  employee_id: string | null;
  full_name: string | null;
  designation: string | null;
  department: string | null;
  performance_rating: number | null;
  profile_picture: string | null;
  reporting_manager_name: string | null;
  contact_number: string | null;
  emergency_contact: string | null;
  role_name: string | null;
  skills: string[];
  joining_date: string | '';

}

interface EmployeeDetailsState {
  details: Record<number, EmployeeDetails>;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeDetailsState = {
  details: {},
  loading: false,
  error: null,
};

export const fetchEmployeePublicDetails = createAsyncThunk(
  'employeeDetails/fetch',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `/api/employees/publicDetailsOfEmployee/`,
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
      const state = getState() as { employeeDetails: EmployeeDetailsState };
      if (state.employeeDetails.details[userId]) {
        return false;
      }
      return true;
    },
  }
);

const MAX_PROFILE_DETAILS = 100;

const employeeDetailsSliceForUsers = createSlice({
  name: 'employeeDetails',
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

export default employeeDetailsSliceForUsers.reducer;
