import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { NavbarItem } from "../@types";
import supabase from "@/Superbase/client";

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

const fetchNavbarData = createAsyncThunk(
  "navbar/fetchNavbarData",
  async (_, { rejectWithValue }) => {
    const { data: navbarList, error: navbarError } = await supabase
      .from("navbar")
      .select("*");
    if (navbarError) return rejectWithValue(navbarError.message);
    return navbarList || [];
  }
);

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchNavbarData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchNavbarData.fulfilled, (state, action) => {
        state.navbar_data = action.payload;
        state.loading = false;
      })
      .addCase(fetchNavbarData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setNavbarData, setCurrentNav } = navbarSlice.actions;
export default navbarSlice.reducer;
