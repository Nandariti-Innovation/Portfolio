import { IconRender } from "@/Components/Icons/IconRender";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { tailwindMerge } from "@/Utils/tailwindMerge";
import { useSelector } from "react-redux";

export const SkillsSection = () => {
  const { skills } = useSelector((state: RootState) => state.skills);

  return (
    <div className="w-full overflow-hidden mx-auto h-fit px-20 py-10 bg-mentorshipBgColor max-lg:px-0">
      <h2 className="text-darkthemebg text-5xl text-left font-medium max-lg:text-3xl max-lg:text-center">
        What I <span className="text-leadcolor-600">Learned</span> so far ?
      </h2>
      <div className="flex gap-4 items-center justify-center w-fit text-darkthemebg text-sm mt-2.5 max-sm:ml-4">
        <div className="flex items-center justify-center gap-1">
          <span className="block h-4 w-4 bg-green-200 rounded-full"></span>
          <p>Confident</p>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="block h-4 w-4 bg-yellow-200 rounded-full"></span>
          <p>Practicing</p>
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="block h-4 w-4 bg-red-200 rounded-full"></span>
          <p>Learning</p>
        </div>
      </div>
      <div className="flex items-center justify-between max-lg:flex-col my-5">
        {/* <div>{<TextShpere />}</div> */}
        <div className="w-11/12 h-fit border border-solid border-lightColorDiscription flex flex-wrap items-stretch justify-center gap-5 rounded-xl py-5">
          {skills.map((elem) => (
            <div
              key={elem.skill_id}
              title={elem.skill_name}
              className={tailwindMerge(
                "h-fit w-fit px-4 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 border border-solid border-leadcolor-100 cursor-pointer hover:bg-leadcolor-400",
                elem.skill_level == "beginner"
                  ? "bg-red-200"
                  : elem.skill_level == "intermediate"
                  ? "bg-yellow-200"
                  : "bg-green-200"
              )}
            >
              <IconRender iconName={elem.skill_image} size={64} />
              <p className="text-darkthemebg font-medium text-xs max-sm:text-xs">
                {elem.skill_name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
