import { ProjectItem } from "@/StateManagement/Redux/@types";
import { calculateDaysBetween } from "@/Utils/helperFunc";
import { Brain, ChartNoAxesColumnIncreasing, Clock3 } from "lucide-react";
import React from "react";

export const ChallengesFaced: React.FC<ChallengesFacedProps> = ({
  projectDetail,
}) => {
  const duration = calculateDaysBetween(
    projectDetail?.project_start_date,
    projectDetail?.project_end_date || new Date()
  );

  return (
    <div className="flex items-stretch justify-between max-lg:flex-col max-lg:gap-10">
      <div className="w-3xl space-y-8 max-lg:w-full">
        <h2 className="text-3xl font-semibold text-leadcolor-600 max-sm:text-2xl">
          What Challenges Were Faced ?
        </h2>
        <p className="text-base first-letter:uppercase max-sm:text-sm">
          {projectDetail?.project_problem_faced}
        </p>
      </div>
      <div className="capitalize w-[30rem] flex flex-wrap items-stretch justify-around gap-4 max-lg:w-full ">
        <div className="w-fit border border-dashed border-leadcolor-100 flex flex-col items-center justify-center gap-2 px-10 py-2.5 rounded-md shadow-sm">
          <Clock3 size={40} />
          <h3 className="text-darkthemebg font-medium text-lg max-sm:text-base">
            Duration
          </h3>
          <p className="text-base text-darkthemebg/50 max-sm:text-sm">
            {duration > 31
              ? `${Math.floor(duration / 31)} months`
              : `${duration} days`}
          </p>
        </div>
        <div className="capitalize w-fit border border-dashed border-leadcolor-100 flex flex-col items-center justify-center gap-2 px-10 py-2.5 rounded-md shadow-sm">
          <Brain size={40} />
          <h3 className="text-darkthemebg font-medium text-lg max-sm:text-base">
            Learning
          </h3>
          <p className="text-base text-darkthemebg/50 max-sm:text-sm">
            {projectDetail.project_learning}
          </p>
        </div>
        <div className="capitalize w-fit border border-dashed border-leadcolor-100 flex flex-col items-center justify-center gap-2 px-10 py-2.5 rounded-md shadow-sm">
          <ChartNoAxesColumnIncreasing size={40} />
          <h3 className="text-darkthemebg font-medium text-lg max-sm:text-base">
            Project Status
          </h3>
          <p className="text-base text-darkthemebg/50 max-sm:text-sm">
            {projectDetail?.project_status}
          </p>
        </div>
      </div>
    </div>
  );
};

interface ChallengesFacedProps {
  projectDetail: ProjectItem;
}
