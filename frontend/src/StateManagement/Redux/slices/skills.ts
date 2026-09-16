import supabase from "@/Superbase/client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { SkillsItem } from "../@types";

interface SkillState {
  loading: boolean;
  error: string | false;
  skills: SkillsItem[];
}

const initialState: SkillState = {
  loading: false,
  skills: [],
  error: false,
};

export const fetchSkills = createAsyncThunk(
  "skills/fetchSkills",
  async (_, { rejectWithValue }) => {
    const { data: skillList, error: skillError } = await supabase
      .from("skills")
      .select("*");

    if (skillError) return rejectWithValue(skillError.message);

    return skillList || [];
  },
);

const skillSlice = createSlice({
  name: "skills",
  initialState,
  reducers: {
    clearSkills: (state) => {
      state.skills = [];
    },
    addSkills: (state, action) => {
      state.skills = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.skills = action.payload;
        state.loading = false;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSkills, addSkills } = skillSlice.actions;
export default skillSlice.reducer;
