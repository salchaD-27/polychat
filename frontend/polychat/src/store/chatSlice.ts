import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  activeRoomId: string | null;
}
const initialState: ChatState = {
  activeRoomId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom(state, action: PayloadAction<string>){state.activeRoomId = action.payload;},
    clearActiveRoom(state){state.activeRoomId = null;},
  },
});

export const { setActiveRoom, clearActiveRoom } = chatSlice.actions;
export default chatSlice.reducer;