import { IconRender } from "@/Components/Icons/IconRender";
import { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import { fetchSkills } from "@/StateManagement/Redux/slices/skills";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export const TechStackShowCase: React.FC<TechStackShowCaseProps> = ({
  skillName,
}) => {
  const { skills } = useSelector((state: RootState) => state.skills);
  const IconDetail = skills.find((elem) => elem.skill_name === skillName);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (skills.length == 0) dispatch(fetchSkills());
  }, [skills, dispatch]);

  if (IconDetail)
    return (
      <div
        key={IconDetail.skill_id}
        title={IconDetail.skill_name}
        className="h-fit w-fit bg-transparent px-4 py-2.5 rounded-lg flex flex-col items-center justify-center gap-1.5 border border-solid border-leadcolor-100 cursor-pointer hover:bg-leadcolor-400"
      >
        <IconRender iconName={IconDetail.skill_image} size={64} />
        <p className="text-darkthemebg font-medium text-xs">
          {IconDetail.skill_name}
        </p>
      </div>
    );
  return null;
};

interface TechStackShowCaseProps {
  skillName: string;
}
