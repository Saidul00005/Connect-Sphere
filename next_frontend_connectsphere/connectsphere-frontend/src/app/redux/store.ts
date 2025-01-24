import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';
import profileReducer from '@/app/redux/slices/profileSlice';
import chatReducer from '@/app/redux/slices/chatSlice';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    chat: chatReducer,
  },
});

// Create type-safe hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed versions of useSelector and useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();