import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type HomepageBlog = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  tags: string[];
  reading_time_minutes: number;
  published_at: string;
  is_featured: boolean;
};

const homepageBlogsSlice = createSlice({
  name: "homepageBlogs",
  initialState: { items: [] as HomepageBlog[] },
  reducers: {
    setHomepageBlogs: (state, action: PayloadAction<HomepageBlog[]>) => {
      state.items = action.payload;
    },
  },
});

export const { setHomepageBlogs } = homepageBlogsSlice.actions;
export default homepageBlogsSlice.reducer;
