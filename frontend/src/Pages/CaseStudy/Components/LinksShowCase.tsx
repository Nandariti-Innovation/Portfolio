import { IconRender } from "@/Components/Icons/IconRender";
import { ProjectItem } from "@/StateManagement/Redux/@types";
import { BriefcaseBusiness, Link2 } from "lucide-react";
import React from "react";

export const LinksShowCase: React.FC<LinksShowCaseProps> = ({
  projectDetail,
}) => {
  return (
    <div className="w-full py-8 flex flex-wrap items-center justify-center gap-5 border-t-2 border-solid border-leadcolor-400">
      {projectDetail?.project_github && (
        <a
          href={projectDetail?.project_github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lightthemebg hover:bg-leadcolor-600 transition-colors bg-leadcolor-600/95 rounded-full p-4 border border-slate-200 shadow-md hover:shadow-lg "
        >
          <IconRender
            iconName="Github"
            size={40}
            color={"var(--color-lightthemebg)"}
          />
        </a>
      )}
      {projectDetail?.project_link && (
        <a
          href={projectDetail?.project_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lightthemebg hover:bg-leadcolor-600 transition-colors bg-leadcolor-600/95 rounded-full p-4 border border-slate-200 shadow-md hover:shadow-lg "
        >
          <Link2 size={40} color={"var(--color-lightthemebg)"} />
        </a>
      )}
      {projectDetail?.project_company_website && (
        <a
          href={projectDetail?.project_company_website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lightthemebg hover:bg-leadcolor-600 transition-colors bg-leadcolor-600/95 rounded-full p-4 border border-slate-200 shadow-md hover:shadow-lg "
        >
          <BriefcaseBusiness size={40} color={"var(--color-lightthemebg)"} />
        </a>
      )}
    </div>
  );
};

interface LinksShowCaseProps {
  projectDetail: ProjectItem;
}
