import { RootState } from "@/StateManagement/Redux/reduxStore";
import { ArrowDownRight } from "lucide-react";
import { useSelector } from "react-redux";

export const Hero = () => {
  const { HeroSection } = useSelector((state: RootState) => state.herosection);
  const { navbar_data } = useSelector((state: RootState) => state.navbar);

  return (
    <section className="hero panel" id="home">
      <div className="hero-kicker">
        <span /> Hello, I’m
      </div>
      <h1>
        {HeroSection.hero_first_name} <em>{HeroSection.hero_last_name}</em>
      </h1>
      <p className="hero-role mt-5">
        {HeroSection.hero_designation.join(" · ").toUpperCase()}
      </p>
      <p className="hero-copy">{HeroSection.hero_short_description}</p>
      <a
        className="round-link"
        href={navbar_data.find((item) => item.navbar_id == 6)?.navbar_link}
        aria-label="Explore my work"
      >
        <ArrowDownRight />
      </a>
      <div className="hero-notes">
        {HeroSection.hero_other_words.map((item) => (
          <span key={item}>{item.toUpperCase()}</span>
        ))}
      </div>
      <p className="scroll-label">Scroll to explore</p>
    </section>
  );
};
