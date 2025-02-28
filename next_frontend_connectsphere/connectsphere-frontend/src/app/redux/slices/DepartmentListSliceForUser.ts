import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

interface Department {
  id: number
  name: string
}

interface DepartmentsState {
  list: Department[]
  loading: boolean
  error: string | null
}

const initialState: DepartmentsState = {
  list: [],
  loading: false,
  error: null,
}

export const fetchDepartments = createAsyncThunk(
  'departments/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/departments/departments_list_for_request_user/')
      return response.data
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data)
      }
      return rejectWithValue({ message: 'An unknown error occurred' })
    }
  }
)

const DepartmentListSliceForUser = createSlice({
  name: 'departments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.list = action.payload
        state.loading = false
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false
        state.error =
          (action.payload as { message: string })?.message || 'Failed to fetch departments'
      })
  },
})

export default DepartmentListSliceForUser.reducer
