import {
  createAsyncThunk,
  createSlice /*, PayloadAction*/,
} from "@reduxjs/toolkit";
import { FileItem } from "../@types";
import supabase from "@/Superbase/client";

interface storageState {
  files: FileItem[];
  loading: boolean;
  error: string | false;
}

const initialState: storageState = {
  files: [],
  loading: false,
  error: false,
};

export const fetchFiles = createAsyncThunk(
  "storage/fetchFiles",
  async (_, { rejectWithValue }) => {
    const { data: list, error: listError } = await supabase.storage
      .from("portfolio")
      .list("");

    if (listError) return rejectWithValue(listError.message);

    return (list as FileItem[]) || [];
  },
);

const storageSlice = createSlice({
  name: "storage",
  initialState,
  reducers: {
    clearfiles: (state) => {
      state.files = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.files = action.payload;
        state.loading = false;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearfiles } = storageSlice.actions;
export default storageSlice.reducer;
