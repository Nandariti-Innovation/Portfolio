import { createSlice } from "@reduxjs/toolkit";
import { SocialItem } from "../@types";

const initialState = {
  socialList: [] as SocialItem[],
  loading: false,
  error: false as string | false,
};

const socialSlice = createSlice({
  name: "socials",
  initialState,
  reducers: {
    updateSocialList(state, action) {
      state.socialList = action.payload;
    },
  },
});

export const { updateSocialList } = socialSlice.actions;
export default socialSlice.reducer;
