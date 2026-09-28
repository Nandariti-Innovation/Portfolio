import { HeroSectionType } from "../@types";
import { createSlice } from "@reduxjs/toolkit";

interface HeroSectionState {
  loading: boolean;
  error: string | false;
  HeroSection: HeroSectionType;
}

const dummyData: HeroSectionType = {
  hero_name: "DUMMY",
  hero_designation: ["DUMMY", "DUMMY", "DUMMY"],
  hero_image: "DUMMY",
  hero_description: "DUMMY",
  hero_short_description: "DUMMY",
  hero_id: 1,
  hero_first_name: "DUMMY",
  hero_last_name: "DUMMY",
  hero_other_words: ["DUMMY", "DUMMY", "DUMMY", "DUMMY"],
  hero_greeting: "DUMMY",
  hero_misc: {
    about_section_heading: {
      index: "00",
      eyebrow: "DUMMY",
      title: "DUMMY",
    },
  },
};

const initialState: HeroSectionState = {
  loading: false,
  HeroSection: dummyData,
  error: false,
};

const herosectionSlice = createSlice({
  name: "herosection",
  initialState,
  reducers: {
    updateHeroSection: (state, action) => {
      state.HeroSection = action.payload;
    },
  },
});

export const { updateHeroSection } = herosectionSlice.actions;
export default herosectionSlice.reducer;
