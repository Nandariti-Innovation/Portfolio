import supabase from "@/Superbase/client";
import { HeroSectionType } from "../@types";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface HeroSectionState {
  loading: boolean;
  error: string | false;
  HeroSection: HeroSectionType;
}

const dummyData: HeroSectionType = {
  hero_name: "Deepanshu Gulia",
  hero_designation: ["Software Engineer", "Automation", "AI Engineer"],
  hero_image:
    "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/herophoto.webp",
  hero_description:
    "I am a Full Stack Developer specializing in the MERN stack. With over one year of professional experience and a portfolio of successful live projects, I have a strong foundation in frontend and backend technologies, including HTML, CSS, JavaScript, React.js, Node.js, and MongoDB.",
  hero_short_description:
    "I build interactive experiences where code, creativity and the physical world meet.",
  hero_id: 1,
  hero_first_name: "Deepanshu",
  hero_last_name: "Gulia",
  hero_other_words: ["code", "create", "automate", "repeat"],
  hero_greeting: "Hello, I'm",
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
