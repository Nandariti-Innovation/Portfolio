import { configureStore } from "@reduxjs/toolkit";
import storageReducer from "./slices/storageslices";
import skillsReducer from "./slices/skills";
import authReducer from "./slices/authentication";
import projectReducer from "./slices/projects";
import navbarReducer from "./slices/navbar";
import HeroSectionReducer from "./slices/herosection";
import serviceReducer from "./slices/services";
import footerReducer from "./slices/footer";
import socialsReducer from "./slices/socials";
import experienceReducer from "./slices/experience";
import mentorshipReducer from "./slices/mentorship";
import settingReducer from "./slices/settings";
import homepageBlogsReducer from "./slices/homepageBlogs";
import homepageSectionsReducer from "./slices/homepageSections";

export const store = configureStore({
  reducer: {
    authentication: authReducer,
    storage: storageReducer,
    experience: experienceReducer,
    skills: skillsReducer,
    projects: projectReducer,
    navbar: navbarReducer,
    herosection: HeroSectionReducer,
    services: serviceReducer,
    footer: footerReducer,
    socials: socialsReducer,
    mentorship: mentorshipReducer,
    settings: settingReducer,
    homepageBlogs: homepageBlogsReducer,
    homepageSections: homepageSectionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
