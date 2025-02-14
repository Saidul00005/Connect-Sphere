import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

interface UserProfileState {
  details: {
    id: number | null
    email: string | null
    first_name: string | null
    last_name: string | null
    role: string | null
    is_approved: boolean | null
    is_active: boolean | null
    profile_picture: string | null
    is_deleted: boolean | null
  }
  loading: boolean
  error: string | null
}

const initialState: UserProfileState = {
  details: {
    id: null,
    email: null,
    first_name: null,
    last_name: null,
    role: null,
    is_approved: null,
    is_active: null,
    profile_picture: null,
    is_deleted: null,
  },
  loading: false,
  error: null,
}

export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/employees/userProfile')
      return response.data
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data)
      }
      return rejectWithValue({ message: 'An unknown error occurred' })
    }
  }
)

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        const {
          id,
          email,
          first_name,
          last_name,
          role,
          is_approved,
          is_active,
          profile_picture,
          is_deleted,
        } = action.payload

        state.details = {
          id,
          email,
          first_name,
          last_name,
          role,
          is_approved,
          is_active,
          profile_picture,
          is_deleted,
        }
        state.loading = false
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as { message: string })?.message || 'Failed to fetch profile'
      })
  }
})

export default userProfileSlice.reducer
