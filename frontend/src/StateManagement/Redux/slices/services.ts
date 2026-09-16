import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ServiceItem } from "../@types";
import supabase from "@/Superbase/client";

interface ServiceStateType {
  loading: boolean;
  error: string | false;
  services: ServiceItem[];
}

const initialState: ServiceStateType = {
  loading: false,
  services: [],
  error: false,
};

const fetchServicesData = createAsyncThunk(
  "services/fetchData",
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase.from("services").select("*");

    if (error) return rejectWithValue(error.message);

    return data || [];
  },
);

const serviceSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    updateServices: (state, action) => {
      state.services = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(fetchServicesData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchServicesData.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.services = action.payload;
      })
      .addCase(fetchServicesData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      }),
});

export const { updateServices } = serviceSlice.actions;
export default serviceSlice.reducer;
