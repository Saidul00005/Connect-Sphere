// app/providers.tsx
'use client'

import { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/app/redux/store'

export function ReduxProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>
}