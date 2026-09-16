import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { SocialItem } from "../@types";
import supabase from "@/Superbase/client";

const initialState = {
  socialList: [] as SocialItem[],
  loading: false,
  error: false as string | false,
};

export const fetchSocials = createAsyncThunk(
  "socials/fetchSocials",
  async (_, { rejectWithValue }) => {
    const { data: socialList, error: socialError } = await supabase
      .from("social")
      .select("*");

    if (socialError) return rejectWithValue(socialError.message);

    return socialList || [];
  }
);

const socialSlice = createSlice({
  name: "socials",
  initialState,
  reducers: {
    updateSocialList(state, action) {
      state.socialList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocials.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchSocials.fulfilled, (state, action) => {
        state.socialList = action.payload;
        state.loading = false;
      })
      .addCase(fetchSocials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateSocialList } = socialSlice.actions;
export default socialSlice.reducer;
