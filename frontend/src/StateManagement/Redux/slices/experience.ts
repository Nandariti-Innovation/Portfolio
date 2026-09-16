import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ExperienceType } from "../@types";
import supabase from "@/Superbase/client";

const initialState = {
  experience: [] as ExperienceType[],
  loading: false,
  error: false as string | false,
};

export const fetchExperienceData = createAsyncThunk(
  "experience/fetch",
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from("work_experience")
      .select("*")
      .order("work_start_date", { ascending: false });

    if (error) {
      return rejectWithValue(error.message);
    }

    console.log("Fetched experience data:", data);
    return data as ExperienceType[];
  }
);

const experienceSlice = createSlice({
  name: "experience",
  initialState,
  reducers: {
    setExperienceData: (state, action) => {
      state.experience = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExperienceData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchExperienceData.fulfilled, (state, action) => {
        state.loading = false;
        state.experience = action.payload;
      })
      .addCase(fetchExperienceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setExperienceData } = experienceSlice.actions;

export default experienceSlice.reducer;
