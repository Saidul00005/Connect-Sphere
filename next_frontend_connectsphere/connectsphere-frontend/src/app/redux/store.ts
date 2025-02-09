import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux';
import profileReducer from '@/app/redux/slices/profileSlice';
import chatRoomsSliceForUser from '@/app/redux/slices/chatRoomsSlice';
import userProfileReducer from '@/app/redux/slices/userProfileSlice';
import employeeListForUser from '@/app/redux/slices/employeeListForUserSlice';
import employeeProfileSliceForUser from '@/app/redux/slices/employeeProfileSliceForUser';
import DepartmentListSliceForUser from '@/app/redux/slices/DepartmentListSliceForUser';
import chatMessagesSliceForUser from '@/app/redux/slices/chatMessagesSlice';
import createChatRoomFormForUser from '@/app/redux/slices/createChatRoomSlice';
import singleChatRoomForUser from '@/app/redux/slices/chatRoomSlice';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    chatRooms: chatRoomsSliceForUser,
    userProfile: userProfileReducer,
    employees: employeeListForUser,
    employee: employeeProfileSliceForUser,
    departments: DepartmentListSliceForUser,
    chatMessages: chatMessagesSliceForUser,
    createChatRoomForm: createChatRoomFormForUser,
    singleChatRoom: singleChatRoomForUser
  },
});

// Create type-safe hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed versions of useSelector and useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();