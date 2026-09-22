import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { DynamicHomepage } from "@/features/homepageSections/templates";

const initialState: DynamicHomepage = { sections: [], templates: {} };

const slice = createSlice({
  name: "homepageSections",
  initialState,
  reducers: {
    setHomepageSections: (_state, action: PayloadAction<DynamicHomepage>) => action.payload,
    clearHomepageSections: () => initialState,
  },
});

export const { setHomepageSections, clearHomepageSections } = slice.actions;
export default slice.reducer;
