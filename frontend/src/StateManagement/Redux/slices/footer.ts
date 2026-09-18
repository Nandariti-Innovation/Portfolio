import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { FooterSectionType } from "../@types";
import supabase from "@/Superbase/client";

const dummyData: FooterSectionType = {
  footer_description: "not fetched yet",
  footer_qr_svg: "not fetched yet",
  footer_email: "not fetched yet",
  footer_address: "not fetched yet",
  footer_heading: {
    index: "00",
    eyebrow: "dummy",
    title_emphasis: "not fetched yet",
    title_line: "not fetched yet",
  },
};

const initialState = {
  loading: false,
  error: false as string | false,
  footerList: dummyData as FooterSectionType,
};

export const fetchFooterData = createAsyncThunk(
  "footer/fetchFooterData",
  async (_, { rejectWithValue }) => {
    const { data: footerList, error: footerError } = await supabase
      .from("footer")
      .select("*");

    if (footerError) return rejectWithValue(footerError.message);

    return footerList[0] || dummyData;
  },
);

const footerSlice = createSlice({
  name: "footer",
  initialState,
  reducers: {
    updateFooterSection(state, action) {
      state.footerList = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFooterData.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(fetchFooterData.fulfilled, (state, action) => {
        state.footerList = action.payload;
        state.loading = false;
      })
      .addCase(fetchFooterData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateFooterSection } = footerSlice.actions;
export default footerSlice.reducer;
