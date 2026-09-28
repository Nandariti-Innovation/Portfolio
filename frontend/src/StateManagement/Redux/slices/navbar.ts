import { createSlice } from "@reduxjs/toolkit";
import { NavbarItem } from "../@types";

interface NavbarState {
  loading: boolean;
  error: string | false;
  navbar_data: NavbarItem[];
  currentNav: string;
}

const initialState: NavbarState = {
  loading: false,
  error: false,
  navbar_data: [],
  currentNav: "Home",
};

const navbarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    setNavbarData: (state, action) => {
      state.navbar_data = action.payload;
    },
    setCurrentNav: (state, action) => {
      state.currentNav = action.payload;
    },
  },
});

export const { setNavbarData, setCurrentNav } = navbarSlice.actions;
export default navbarSlice.reducer;
