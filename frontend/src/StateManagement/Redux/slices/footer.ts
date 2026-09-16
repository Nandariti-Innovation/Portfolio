import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { FooterSectionType } from "../@types";
import supabase from "@/Superbase/client";

const dummyData: FooterSectionType = {
  footer_description:
    "Thank you for visiting my website and taking the time to explore my work. I appreciate your interest and hope you found the content engaging and insightful. If you have any questions, feedback, or just want to connect, I’d love to hear from you. Let’s stay connected.",
  footer_qr_svg:
    "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/linktreesvg.svg",
  footer_email: "deepanshu.work@gmail.com",
  footer_address: "Najafgarh, New Delhi - 43",
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
  }
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
