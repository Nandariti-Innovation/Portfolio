import { useSelector } from "react-redux";
import { SectionHeader } from "./SectionHeader";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { formatSQLDate } from "@/Utils/helperFunc";

type HeadingType = {
  index: string;
  eyebrow: string;
  title: string;
};

export const Experience = () => {
  const { experience } = useSelector((state: RootState) => state.experience);
  const { setting } = useSelector((state: RootState) => state.settings);
  const heading = setting.find((item) => item.setting_name == "headings")
    ?.setting_object.experience as HeadingType;

  return (
    <section className="panel content-panel" id="experience">
      <SectionHeader
        index={heading?.index || "02"}
        eyebrow={heading?.eyebrow.toUpperCase() || "EXPERIENCE"}
        title={heading?.title || "Ideas become useful when they ship."}
      />
      <div className="timeline">
        {experience.map((item) => (
          <article key={item.work_id}>
            <span>
              {formatSQLDate(item.work_start_date || false)} -{" "}
              {formatSQLDate(item.work_end_date || false) || "Now"}
            </span>
            <div>
              <h3>{item.work_designation}</h3>
              <p className="accent">{item.work_company_name}</p>
              <p>{item.work_short_description}</p>
              <div className="skill-list">
                {item.work_tech_stack.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
