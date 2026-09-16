import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { BottomButtonCurveImg } from "@/Components/BottomButtonCurveImg/BottomButtonCurveImg.js";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";
import { useSelector } from "react-redux";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { ProjectItem } from "@/StateManagement/Redux/@types";

const projectsDesArr = [
  "Landing Pages",
  "Web Designs",
  "CSS Animation",
  "Mobile Apps",
  "Web Games",
  "3D Websites",
  "Encryption",
  "JavaScript & TypeScript",
  "Live Projects",
  "Full Stack Projects",
  "UI Designs",
];

export const ProjectSection = () => {
  const { featuredProject } = useSelector((state: RootState) => state.projects);
  const navigate = useNavigate();
  const { darkTheme } = useContext(settingContext);

  return (
    <div className="py-20 w-full overflow-hidden" id="project">
      <div className="w-4/5 mx-auto flex items-center justify-between">
        <h2 className="text-6xl font-semibold text-left w-fit h-fit m-0 p-0 text-quoteColor dark:text-quoteColordark max-lg:text-2xl">
          Lets have a look at <br /> my{" "}
          <span className="text-leadcolor-600">Projects</span>
        </h2>
        <button
          className="py-5 px-10 rounded-full font-semibold text-xl bg-leadcolor-600 text-lightthemebg hover:underline max-lg:text-sm max-lg:py-1.5 max-lg:px-5"
          onClick={() => navigate("/projects")}
        >
          See More
        </button>
      </div>
      <div className="w-4/5 mx-auto my-10 flex items-center justify-between flex-wrap gap-y-10">
        {featuredProject &&
          featuredProject.map((elem: ProjectItem) => (
            <div
              key={"projects_section_home_" + elem.project_id}
              className="w-[400] h-[500] group cursor-pointer relative overflow-hidden rounded-xl"
              onClick={() => navigate(`/project/${elem.project_id}`)}
            >
              <h2 className="absolute z-20 top-0 w-full py-5 text-xl font-medium text-center text-lightthemebg bg-[rgba(0,0,0,0.8)] rounded-t-3xl transition-all duration-300 group-hover:py-7">
                {elem.project_name}
              </h2>
              <BottomButtonCurveImg
                imgURL={
                  "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/" +
                  elem.project_image
                }
                inheritClr={darkTheme ? "#333333" : "#fff"}
                outlineClassCss={
                  "outline-lightthemebg dark:outline-darkthemebg"
                }
              />
            </div>
          ))}
      </div>
      <div className="w-4/5 mx-auto flex items-center justify-center gap-5 flex-wrap">
        {projectsDesArr.map((elem, index) => (
          <p
            key={"projects_section_sumarry_" + index}
            className="text-xl py-4 px-10 rounded-full bg-mentorshipBgColor max-lg:text-sm max-lg:py-1.5 max-lg:px-5"
          >
            {elem}
          </p>
        ))}
      </div>
    </div>
  );
};
