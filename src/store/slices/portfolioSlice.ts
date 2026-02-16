import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Asset {
  id: string
  name: string
  symbol: string
  category: 'action' | 'obligation' | 'etf' | 'crypto' | 'autre'
  quantity: number
  unitPrice: number
  currency: string
}

export interface PortfolioState {
  assets: Asset[]
  lastUpdated: string | null
}

const initialState: PortfolioState = {
  assets: [],
  lastUpdated: null,
}

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    setAssets(state, action: PayloadAction<Asset[]>) {
      state.assets = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    addAsset(state, action: PayloadAction<Asset>) {
      state.assets.push(action.payload)
      state.lastUpdated = new Date().toISOString()
    },
    updateAsset(state, action: PayloadAction<Asset>) {
      const i = state.assets.findIndex((a) => a.id === action.payload.id)
      if (i !== -1) state.assets[i] = action.payload
      state.lastUpdated = new Date().toISOString()
    },
    removeAsset(state, action: PayloadAction<string>) {
      state.assets = state.assets.filter((a) => a.id !== action.payload)
      state.lastUpdated = new Date().toISOString()
    },
  },
})

export const { setAssets, addAsset, updateAsset, removeAsset } = portfolioSlice.actions
export default portfolioSlice.reducer
