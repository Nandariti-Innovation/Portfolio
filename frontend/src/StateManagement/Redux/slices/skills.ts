import { createSlice } from "@reduxjs/toolkit";
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
});

export const { clearSkills, addSkills } = skillSlice.actions;
export default skillSlice.reducer;
