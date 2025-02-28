import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

interface ProfileState {
  details: {
    id: number | null
    user: {
      id: number | null
      first_name: string | null
      last_name: string | null
      role: string | null
      is_approved: boolean
      profile_picture: string | null
      is_deleted: boolean
    } | null
    department: {
      id: number | null
      name: string | null
    } | null
    documents: Array<{
      id: number
      document_type: string
      document_type_display: string
      document: string
      uploaded_at: string
      description: string
      employee: number
    }>
    reporting_manager_name: string | null
    employee_id: string | null
    designation: string | null
    joining_date: string | ''
    contact_number: string | null
    emergency_contact: string | null
    address: string | null
    skills: string[]
    performance_rating: number | null
    last_review_date: string | ''
    reporting_manager: number | null
  } | null
  loading: boolean
  error: string | null
}

const initialState: ProfileState = {
  details: null,
  loading: false,
  error: null,
}

export const fetchProfile = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/employees/profile/')
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
