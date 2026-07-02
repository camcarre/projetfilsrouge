import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface InvestorProfile {
  id?: number
  user_id?: number
  risk_tolerance: number
  investment_horizon: 'short' | 'medium' | 'long'
  investment_goal: 'growth' | 'income' | 'preservation'
  monthly_investment: number
  esg_preference: boolean
  knowledge_level: 'beginner' | 'intermediate' | 'advanced'
}

interface ProfileState {
  profile: InvestorProfile | null
  isLoading: boolean
  error: string | null
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  error: null,
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<InvestorProfile | null>) {
      state.profile = action.payload
      state.error = null
    },
    clearProfile(state) {
      state.profile = null
      state.error = null
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload
    },
  },
})

export const { setProfile, clearProfile, setLoading, setError } = profileSlice.actions
export default profileSlice.reducer
