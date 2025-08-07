import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
export const store = configureStore({
  reducer: {
    chat: chatReducer,
    // other reducers...
  },
});

// Infer RootState and AppDispatch types as well
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;