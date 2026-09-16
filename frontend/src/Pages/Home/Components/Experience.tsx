import { useSelector } from "react-redux";
import { Company } from "@/Components/Experience/Company";
import { RootState } from "@/StateManagement/Redux/reduxStore";

export const Experience = () => {
  const { experience } = useSelector((state: RootState) => state.experience);
  return (
    <div className="my-10 overflow-hidden w-full" id="experience">
      <h2 className="text-6xl font-medium text-center text-darkthemebg dark:text-lightthemebg max-lg:text-4xl">
        My <span className="text-leadcolor-600">Work Experience</span>
      </h2>
      <div className="my-10">
        {experience.map((exp, index) => (
          <Company
            key={exp.work_id}
            data={exp}
            num={index}
            last={index == experience.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
