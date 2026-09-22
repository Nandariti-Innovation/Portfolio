import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { SettingsType } from "../@types";
import supabase from "@/Superbase/client";

const initialState = {
  setting: [] as SettingsType[],
  loading: false as boolean,
  error: false as string | false,
};

export const fetchSettingData = createAsyncThunk(
  "settings/fetch",
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase.from("settings").select("*");

    if (error) return rejectWithValue(error.message);

    console.log("Fetched settings data:", data);
    return data as SettingsType[];
  },
);

const settingSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettingData: (state, action: PayloadAction<SettingsType[]>) => {
      state.setting = action.payload;
    },
    upsertSettingData: (state, action: PayloadAction<SettingsType>) => {
      const index = state.setting.findIndex(
        (item) => item.setting_name === action.payload.setting_name,
      );
      if (index === -1) state.setting.push(action.payload);
      else state.setting[index] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettingData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchSettingData.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.setting = action.payload;
      })
      .addCase(fetchSettingData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSettingData, upsertSettingData } = settingSlice.actions;
export default settingSlice.reducer;
