import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

interface EmployeeDetails {
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
  details: EmployeeDetails | null;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  details: null,
  loading: false,
  error: null,
};

export const fetchEmployeeDetails = createAsyncThunk(
  'employee/fetchDetails',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/employees/get_employee_details_for_user/`, { userId });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: 'An unknown error occurred' });
    }
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
        state.details = action.payload;
        state.loading = false;
      })
      .addCase(fetchEmployeeDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as { message: string })?.message || 'Failed to fetch employee details';
      });
  },
});

export default employeeProfileSliceForUser.reducer;
