import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';
import profileReducer from '@/app/redux/slices/profileSlice';
import chatRoomReducer from '@/app/redux/slices/chatRoomSlice';
import userProfileReducer from '@/app/redux/slices/userProfileSlice';
import employeeListForUserReducer from '@/app/redux/slices/employeeListForUserSlice';
import employeeProfileSliceForUser from '@/app/redux/slices/employeeProfileSliceForUser';
import DepartmentListSliceForUser from '@/app/redux/slices/DepartmentListSliceForUser';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    chatRooms: chatRoomReducer,
    userProfile: userProfileReducer,
    employees: employeeListForUserReducer,
    employee: employeeProfileSliceForUser,
    departments: DepartmentListSliceForUser
  },
});

// Create type-safe hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed versions of useSelector and useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();