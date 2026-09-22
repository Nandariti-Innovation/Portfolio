import { useSelector } from "react-redux";
import { SectionHeader } from "./SectionHeader";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { HeadingType } from "@/StateManagement/Redux/@types";

export const About = () => {
  const { HeroSection } = useSelector((state: RootState) => state.herosection);
  const { skills } = useSelector((state: RootState) => state.skills);
  const heading = HeroSection.hero_misc.about_section_heading as HeadingType;

  return (
    <section className="panel split-panel" id="about">
      <SectionHeader
        index={heading?.index || "01"}
        eyebrow={heading?.eyebrow.toUpperCase() || "ABOUT"}
        title={heading?.title || "Building digital tools for the real world."}
      />
      <div className="content-card">
        <p className="large-copy">{HeroSection.hero_description}</p>
        <div className="skill-list">
          {skills.map((skill) => (
            <span key={skill.skill_id}>{skill.skill_name}</span>
          ))}
        </div>
      </div>
    </section>
  );
};
