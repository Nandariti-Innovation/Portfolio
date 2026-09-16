import { RootState } from "@/StateManagement/Redux/reduxStore";
import React from "react";
import { useSelector } from "react-redux";

export const Mentorship: React.FC = () => {
  const { mentorships } = useSelector((state: RootState) => state.mentorship);
  return (
    <div className="w-full h-fit overflow-hidden py-24 flex items-center justify-evenly bg-mentorshipBgColor group max-lg:flex-col max-lg:rounded-none">
      <div className="w-80 h-fit relative flex items-center justify-center">
        <span className="w-80 h-96 block rounded-3xl bg-leadcolor-400 border-2 border-solid border-leadcolor-100 absolute -bottom-[1px] z-10"></span>
        <span
          className={`w-full aspect-square border-[5px] border-solid border-leadcolor-600 bg-transparent absolute top-0 scale-0 group-hover:scale-[1] rounded-full transition-all duration-100`}
        ></span>
        <span
          className={`w-full aspect-square border-[4px] border-solid border-leadcolor-600 bg-transparent absolute top-0 scale-0 group-hover:scale-[1.1] rounded-full transition-all duration-150`}
        ></span>
        <span
          className={`w-full aspect-square border-[3px] border-solid border-leadcolor-600 bg-transparent absolute top-0 scale-0 group-hover:scale-[1.2] rounded-full transition-all duration-200`}
        ></span>
        <span
          className={`w-full aspect-square border-[2px] border-solid border-leadcolor-600 bg-transparent absolute top-0 scale-0 group-hover:scale-[1.3] rounded-full transition-all duration-300`}
        ></span>
        <span
          className={`w-full aspect-square border-[1px] border-solid border-leadcolor-600 bg-transparent absolute top-0 scale-0 group-hover:scale-[1.4] rounded-full transition-all duration-[400ms]`}
        ></span>
        <span
          className={`w-full aspect-square border-[0.5px] border-solid border-leadcolor-600 bg-transparent absolute top-0 scale-0 group-hover:scale-[1.5] rounded-full transition-all duration-[500ms]`}
        ></span>
        <div className="w-5/6 h-fit z-20">
          <img
            src={mentorships.mentor_image}
            alt="my photo mentorship section"
            loading="lazy"
            className="w-full h-full"
          />
        </div>
      </div>
      <div className="w-fit h-2/3 flex flex-col gap-10 items-start justify-between max-lg:w-11/12 max-lg:gap-2.5">
        <h2 className="text-[2.5rem] font-semibold text-darkthemebg capitalize w-fit  max-lg:text-4xl max-lg:text-center">
          {mentorships.mentor_title}
        </h2>
        <p className="text-xl font-normal text-lightColorDiscription w-[40rem] max-lg:text-base max-lg:w-full">
          {mentorships.mentor_description}
        </p>
        <div className="flex items-center justify-between w-full text-darkthemebg text-3xl font-medium">
          <p className="max-lg:leading-5">
            {mentorships.mentor_projects_no}+ <br />
            <span className="text-lightColorDiscription font-normal text-xl max-lg:text-sm max-lg:mt-0">
              {mentorships.mentor_projects_text}
            </span>
          </p>
          <p className="max-lg:leading-5">
            {mentorships.mentor_sessions_no}+ <br />
            <span className="text-lightColorDiscription font-normal text-xl max-lg:text-sm">
              {mentorships.mentor_sessions_text}
            </span>
          </p>
        </div>
        <a
          href={mentorships.mentor_link}
          target="_blank"
          rel="noreferrer"
          className="px-5 py-3 rounded-lg text-3xl font-semibold border-2 border-solid border-darkthemebg text-darkthemebg hover:bg-darkthemebg hover:text-lightthemebg  max-lg:text-xl max-lg:py-2"
        >
          {mentorships.mentor_button}
        </a>
      </div>
    </div>
  );
};
