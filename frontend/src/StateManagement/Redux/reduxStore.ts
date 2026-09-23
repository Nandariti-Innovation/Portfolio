import { configureStore } from "@reduxjs/toolkit";
import skillsReducer from "./slices/skills";
import navbarReducer from "./slices/navbar";
import HeroSectionReducer from "./slices/herosection";
import footerReducer from "./slices/footer";
import socialsReducer from "./slices/socials";
import homepageSectionsReducer from "./slices/homepageSections";
import type storageReducer from "./slices/storageslices";
import type authReducer from "./slices/authentication";
import type projectReducer from "./slices/projects";
import type experienceReducer from "./slices/experience";

export const store = configureStore({
  reducer: {
    skills: skillsReducer,
    navbar: navbarReducer,
    herosection: HeroSectionReducer,
    footer: footerReducer,
    socials: socialsReducer,
    homepageSections: homepageSectionsReducer,
  },
});

type RouteScopedState = {
  authentication: ReturnType<typeof authReducer>;
  storage: ReturnType<typeof storageReducer>;
  experience: ReturnType<typeof experienceReducer>;
  projects: ReturnType<typeof projectReducer>;
};

export type RootState = ReturnType<typeof store.getState> & RouteScopedState;
export type AppDispatch = typeof store.dispatch;
