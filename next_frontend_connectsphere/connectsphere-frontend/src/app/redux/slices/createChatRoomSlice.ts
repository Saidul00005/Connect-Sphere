import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createChatRoom } from "@/app/redux/slices/chatRoomsSlice"
import type { Employee } from "@/app/dashboard/collegues/types/employeeListTypes";

interface CreateChatRoomState {
  type: "GROUP" | "DIRECT";
  name: string;
  selectedParticipants: Employee[];
  createdRoomId: number | null;
}

const initialState: CreateChatRoomState = {
  type: "GROUP",
  name: "",
  selectedParticipants: [],
  createdRoomId: null
};

const createChatRoomFormSlice = createSlice({
  name: "createChatRoomForm",
  initialState,
  reducers: {
    setType: (state, action: PayloadAction<"GROUP" | "DIRECT">) => {
      state.type = action.payload;
      state.selectedParticipants = [];
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    addParticipant: (state, action: PayloadAction<Employee>) => {
      if (!state.selectedParticipants.find(p => p.id === action.payload.id)) {
        if (state.type === "DIRECT") {
          state.selectedParticipants = [action.payload];
        } else {
          state.selectedParticipants.push(action.payload);
        }
      }
    },
    removeParticipant: (state, action: PayloadAction<number>) => {
      state.selectedParticipants = state.selectedParticipants.filter(
        p => p.id !== action.payload
      );
    },
    resetForm: () => initialState
  },
  extraReducers: (builder) => {
    builder.addCase(createChatRoom.fulfilled, (state, action) => {
      state.createdRoomId = action.payload.chatroom.id;
    });
  }
});

export const {
  setType,
  setName,
  addParticipant,
  removeParticipant,
  resetForm
} = createChatRoomFormSlice.actions;
export default createChatRoomFormSlice.reducer;