import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

interface ProfileState {
  details: any
  loading: boolean
  error: string | null
}

const initialState: ProfileState = {
  details: null,
  loading: false,
  error: null
}

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/employees/profile')
      return response.data
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data)
      }
      return rejectWithValue({ message: 'An unknown error occurred' })
    }
  }
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.details = action.payload
        state.loading = false
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as { message: string })?.message || 'Failed to fetch profile'
      })
  }
})

export default profileSlice.reducer