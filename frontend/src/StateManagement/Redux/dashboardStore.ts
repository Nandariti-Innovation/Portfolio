import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authentication";
import experienceReducer from "./slices/experience";
import footerReducer from "./slices/footer";
import HeroSectionReducer from "./slices/herosection";
import homepageSectionsReducer from "./slices/homepageSections";
import navbarReducer from "./slices/navbar";
import projectReducer from "./slices/projects";
import skillsReducer from "./slices/skills";
import socialsReducer from "./slices/socials";
import storageReducer from "./slices/storageslices";

export const dashboardStore = configureStore({
  reducer: {
    authentication: authReducer,
    storage: storageReducer,
    experience: experienceReducer,
    skills: skillsReducer,
    projects: projectReducer,
    navbar: navbarReducer,
    herosection: HeroSectionReducer,
    footer: footerReducer,
    socials: socialsReducer,
    homepageSections: homepageSectionsReducer,
  },
});
