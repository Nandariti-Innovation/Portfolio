import { NewExperienceModal } from "@/Pages/Dashboard/Experience/Component/NewExperienceModal";
import { ExperienceType } from "@/StateManagement/Redux/@types";
import { formatSQLDate } from "@/Utils/helperFunc";
import { tailwindMerge } from "@/Utils/tailwindMerge";
import { Briefcase, Pen } from "lucide-react";
import { Dialog } from "radix-ui";
import React from "react";

export const Company: React.FC<CompanyProps> = ({
  data,
  num,
  last,
  panelOptions = false,
}) => {
  const StartingDate = formatSQLDate(data.work_start_date || false);
  const EndingDate = formatSQLDate(data.work_end_date || false);

  return (
    <div className="relative flex items-stretch justify-between w-5/6 mx-auto h-fit max-lg:flex-col max-lg:items-start mb-4 2xl:w-[1440px]">
      <div className="absolute w-fit h-full left-[42%] -translate-x-1/2 top-2 max-lg:-top-[18%] max-lg:-left-10 max-lg:scale-[60%] max-lg:translate-x-0">
        {panelOptions ? (
          <Dialog.Root modal={true}>
            <Dialog.Trigger asChild>
              <span
                className={tailwindMerge(
                  "flex items-center justify-center cursor-pointer w-9 aspect-square rounded-full outline-2 outline-darkthemebg dark:outline-lightthemebg outline-dashed outline-offset-4 max-lg:w-2.5 max-lg:outline-offset-2 max-lg:outline-1",
                  !(num % 2) ? "bg-leadcolor-600" : "bg-quoteColor"
                )}
              >
                <Pen size={20} className="text-white" />
              </span>
            </Dialog.Trigger>
            <NewExperienceModal initialData={data} isUpdating={true} />
          </Dialog.Root>
        ) : (
          <span
            className={tailwindMerge(
              "flex items-center justify-center w-9 aspect-square rounded-full outline-2 outline-darkthemebg dark:outline-lightthemebg outline-dashed outline-offset-4 max-lg:w-fit max-lg:p-2 max-lg:outline-offset-2 max-lg:outline-1",
              !(num % 2) ? "bg-leadcolor-600" : "bg-quoteColor"
            )}
          >
            <Briefcase size={20} className="text-white" />
          </span>
        )}
        {!last && (
          <span className="block h-[91%] w-1/2 border-r-2 border-dashed border-darkthemebg dark:border-lightthemebg mt-3 max-lg:hidden"></span>
        )}
      </div>
      <div className="max-w-1/3 max-lg:max-w-full">
        <h2 className="w-full text-4xl font-semibold text-quoteColor dark:text-lightthemebg my-2.5 max-lg:text-2xl max-lg:my-0">
          {data.work_company_name}
        </h2>
        <p className="font-normal text-lg text-lightColorDiscription max-lg:text-base">
          {StartingDate || "N/A"} - {EndingDate || "Present"}
        </p>
        <p className="font-normal text-sm text-lightColorDiscription max-lg:text-base">
          {data.work_location}
        </p>
        <p className="font-normal text-sm text-lightColorDiscription max-lg:text-base">
          {data.work_type}
        </p>
      </div>
      <div className="max-w-2/5 max-lg:max-w-full ">
        <h2 className="text-4xl font-semibold text-quoteColor dark:text-lightthemebg my-2.5 max-lg:text-base max-lg:w-fit">
          {data.work_designation}
        </h2>
        <ul className="font-normal text-lg text-lightColorDiscription list-disc w-[610px] max-lg:w-11/12 max-lg:text-sm">
          {data.work_roles_responsibility.map((elem, index) => (
            <li key={"experience_points_" + data.work_company_name + index}>
              {elem}
            </li>
          ))}
        </ul>
        <h3 className="text-lg font-semibold text-quoteColor dark:text-lightthemebg my-2.5 max-lg:text-base max-lg:w-fit">
          Tech Stack:
        </h3>
        <p className="font-normal text-sm text-lightColorDiscription max-lg:text-base">
          {data.work_tech_stack.join(", ")}
        </p>
      </div>
    </div>
  );
};

interface CompanyProps {
  data: ExperienceType;
  num: number;
  last: boolean;
  panelOptions?: boolean;
}
