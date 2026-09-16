import { ProjectItem } from "@/StateManagement/Redux/@types";
import {
  ArrowBigRightDash,
  MonitorSmartphone,
  UserCircle,
  Users,
} from "lucide-react";
import React from "react";

export const RolesResponsibilites: React.FC<RolesResponsibilitesProps> = ({
  projectDetail,
}) => {
  return (
    <div className="flex  items-center justify-between max-lg:flex-col-reverse max-lg:gap-10">
      <div className="capitalize w-[30rem] flex flex-wrap items-stretch justify-around gap-4 max-lg:w-full max-lg:justify-evenly">
        <div className="w-fit border border-dashed border-leadcolor-100 flex flex-col items-center justify-center gap-2 px-10 py-2.5 rounded-md shadow-sm">
          <MonitorSmartphone size={40} />
          <h3 className="text-darkthemebg font-medium text-lg max-sm:text-base">
            Application Platforms
          </h3>
          <p className="text-base text-darkthemebg/50 max-sm:text-sm">
            {projectDetail.project_platform}
          </p>
        </div>
        <div className="capitalize w-fit border border-dashed border-leadcolor-100 flex flex-col items-center justify-center gap-2 px-10 py-2.5 rounded-md shadow-sm">
          <Users size={40} />
          <h3 className="text-darkthemebg font-medium text-lg max-sm:text-base">
            Team size
          </h3>
          <p className="text-base text-darkthemebg/50 max-sm:text-sm">
            {projectDetail?.project_team_size <= 1
              ? "Solo"
              : projectDetail?.project_team_size + " Members"}
          </p>
        </div>
        <div className="capitalize w-fit border border-dashed border-leadcolor-100 flex flex-col items-center justify-center gap-2 px-10 py-2.5 rounded-md shadow-sm">
          <UserCircle size={40} />
          <h3 className="text-darkthemebg font-medium text-lg max-sm:text-base">
            My Role
          </h3>
          <p className="text-base text-darkthemebg/50 max-sm:text-sm">
            {projectDetail?.project_role}
          </p>
        </div>
      </div>
      <div className="w-3xl space-y-4 max-lg:w-full">
        <h2 className="text-3xl font-semibold text-leadcolor-600 mb-8 max-sm:text-2xl">
          My Roles and Responsibilities ?
        </h2>
        {projectDetail?.project_features.map((elem, index) => (
          <div
            key={`${projectDetail?.project_id}-${index}`}
            className="flex items-start justify-start gap-2"
          >
            <ArrowBigRightDash
              size={24}
              className="inline-block text-leadcolor-600"
            />
            <p className="text-base text-left w-11/12 h-fit max-sm:text-sm">
              {elem}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface RolesResponsibilitesProps {
  projectDetail: ProjectItem;
}
