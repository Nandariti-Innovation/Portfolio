import supabase from "@/Superbase/client";
import { HeroSectionType } from "../@types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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

const fetchHeroSectionData = createAsyncThunk(
  "herosection/fetchData",
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase.from("home_hero").select("*");
    if (error) return rejectWithValue(error.message);
    return data[0] || dummyData;
  },
);

const herosectionSlice = createSlice({
  name: "herosection",
  initialState,
  reducers: {
    updateHeroSection: (state, action) => {
      state.HeroSection = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroSectionData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchHeroSectionData.fulfilled, (state, action) => {
        state.HeroSection = action.payload;
        state.loading = false;
      })
      .addCase(fetchHeroSectionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateHeroSection } = herosectionSlice.actions;
export default herosectionSlice.reducer;
