import { Github } from "@/Components/Icons/SVG/Github";
import { LinkedIn } from "@/Components/Icons/SVG/LinkedIn";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { ArrowUpRight, Mail } from "lucide-react";
import { JSX } from "react";
import { useSelector } from "react-redux";

type HeadingType = {
  index: string;
  eyebrow: string;
  title_line: string;
  title_emphasis: string;
};

export const Contact = () => {
  const { socialList } = useSelector((state: RootState) => state.socials);
  const { footerList } = useSelector((state: RootState) => state.footer);
  const { HeroSection } = useSelector((state: RootState) => state.herosection);
  const { setting } = useSelector((state: RootState) => state.settings);
  const heading = setting.find((item) => item.setting_name == "headings")
    ?.setting_object.footer as HeadingType;

  const socialsvg: Record<string, JSX.Element> = {
    Github: <Github color="grey" />,
    LinkedIn: <LinkedIn />,
    Mail: <Mail />,
  };

  return (
    <footer className="panel contact" id="contact">
      <p className="eyebrow">
        {heading?.index || "05"} / {heading?.eyebrow || "LET’S BUILD"}
      </p>
      <h2>
        {heading?.title_line || "Have a difficult idea?"}
        <br />
        <em>{heading?.title_emphasis || "Let’s make it move."}</em>
      </h2>
      <div className="contact-details">
        <div className="contact-copy">
          <p>{footerList.footer_description}</p>
          <a
            className="contact-mail"
            href={`mailto:${footerList.footer_email}`}
          >
            <span>{footerList.footer_email}</span> <ArrowUpRight />
          </a>
        </div>
        <figure className="contact-qr">
          <div className="contact-qr-code">
            <img
              src={footerList.footer_qr_svg}
              alt="QR code to connect with Deepanshu"
              width={180}
              height={180}
              loading="lazy"
            />
          </div>
          <figcaption>Scan to connect</figcaption>
        </figure>
      </div>
      <div className="socials">
        {socialList.map((social) => (
          <a
            key={social.social_link}
            href={social.social_link}
            target="_blank"
            rel="noreferrer"
          >
            {socialsvg[social.social_svg]} {social.social_title}
          </a>
        ))}
      </div>
      <p className="copyright">
        © {new Date().getFullYear()} {HeroSection.hero_name}
      </p>
    </footer>
  );
};
