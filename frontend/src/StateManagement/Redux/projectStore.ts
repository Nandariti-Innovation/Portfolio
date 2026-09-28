import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "./slices/projects";

export const projectStore = configureStore({
  reducer: { projects: projectReducer },
});
