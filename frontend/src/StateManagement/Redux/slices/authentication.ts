import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  isAuth: false,
  userToken: "",
  error: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuth = true;
      state.userToken = action.payload;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.loading = false;
      state.isAuth = false;
      state.userToken = "";
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;

export default authSlice.reducer;
