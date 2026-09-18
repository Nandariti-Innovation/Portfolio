import { useSelector } from "react-redux";
import { SectionHeader } from "./SectionHeader";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { formatSQLDate } from "@/Utils/helperFunc";
import { getSectionConfiguration } from "@/features/homepageSections/manifest";

export const Experience = () => {
  const { experience } = useSelector((state: RootState) => state.experience);
  const { setting } = useSelector((state: RootState) => state.settings);
  const section = getSectionConfiguration(setting, "experience");

  if (!section?.enabled) return null;

  const { heading } = section;

  return (
    <section className="panel content-panel" id="experience">
      <SectionHeader
        index={heading.index}
        eyebrow={heading.eyebrow.toUpperCase()}
        title={heading.title}
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
