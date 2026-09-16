import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { MentorshipType } from "../@types";
import supabase from "@/Superbase/client";

const dummyData: MentorshipType = {
  mentor_title: "Senior Developer",
  mentor_image: "https://example.com/mentor.jpg",
  mentor_description: "An experienced developer in the field.",
  mentor_link: "https://example.com/mentor",
  mentor_button: "View Profile",
  mentor_projects_no: 5,
  mentor_sessions_no: 10,
  mentor_projects_text: "Projects",
  mentor_sessions_text: "Sessions",
};

const initialState = {
  mentorships: dummyData as MentorshipType,
  loading: false as boolean,
  error: false as string | false,
};

const fetchMentorshipData = createAsyncThunk(
  "mentorship/fetchData",
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase.from("mentorship").select("*");
    if (error) {
      return rejectWithValue(error.message);
    }
    return data[0];
  }
);

const mentorshipSlice = createSlice({
  name: "mentorship",
  initialState,
  reducers: {
    setMentorshipData: (state, action) => {
      state.mentorships = action.payload as MentorshipType;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentorshipData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchMentorshipData.fulfilled, (state, action) => {
        state.loading = false;
        state.mentorships = action.payload as MentorshipType;
      })
      .addCase(fetchMentorshipData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setMentorshipData } = mentorshipSlice.actions;

export default mentorshipSlice.reducer;
