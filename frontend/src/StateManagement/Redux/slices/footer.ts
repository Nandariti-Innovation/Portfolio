import { createSlice } from "@reduxjs/toolkit";
import { FooterSectionType } from "../@types";

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

const footerSlice = createSlice({
  name: "footer",
  initialState,
  reducers: {
    updateFooterSection(state, action) {
      state.footerList = action.payload;
    },
  },
});

export const { updateFooterSection } = footerSlice.actions;
export default footerSlice.reducer;
