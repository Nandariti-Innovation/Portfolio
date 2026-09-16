import supabase from "@/Superbase/client";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ProjectItem } from "../@types";

interface ProjectState {
  loading: boolean;
  error: string | false;
  projects: ProjectItem[];
  featuredProject: ProjectItem[] | null;
  editProject: number;
}

const initialState: ProjectState = {
  loading: false,
  projects: [],
  error: false,
  featuredProject: null,
  editProject: -1,
};

export const fetchProjectsList = createAsyncThunk(
  "projects/fetchProjectsList",
  async (_, { rejectWithValue }) => {
    const { data: projectList, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .order("project_id", { ascending: false });

    if (projectError) return rejectWithValue(projectError.message);

    return projectList || [];
  },
  {
    // Strict Mode and multiple consumers should share an in-flight request.
    condition: (_, { getState }) => {
      const state = getState() as { projects: ProjectState };
      return !state.projects.loading;
    },
  },
);

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProjects: (state) => {
      state.projects = [];
    },
    setFeatureProjectdata: (state, action) => {
      state.featuredProject = action.payload;
    },
    setEditProject: (state, action) => {
      state.editProject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsList.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchProjectsList.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.loading = false;
      })
      .addCase(fetchProjectsList.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Unable to load projects.";
      });
  },
});

export const { clearProjects, setFeatureProjectdata, setEditProject } =
  projectSlice.actions;
export default projectSlice.reducer;
