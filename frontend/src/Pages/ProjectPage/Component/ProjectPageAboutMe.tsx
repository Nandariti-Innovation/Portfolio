import { Link } from "react-router-dom";
import { NameSVG } from "@/Components/Icons/SVG/NameSVGs/NameSVG";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import { IconRender } from "@/Components/Icons/IconRender";
import { CloudCheck, Code2, Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSocials } from "@/StateManagement/Redux/slices/socials";

export const ProjectPageAboutMe = () => {
  const { socialList } = useSelector((state: RootState) => state.socials);
  const { footerList } = useSelector((state: RootState) => state.footer);
  const [practiceProjects, setPracticeProjects] = useState(45);
  const dispatch = useDispatch<AppDispatch>();

  const fetchPracticeProjects = async () => {
    try {
      const res = await fetch(
        "https://api.github.com/users/deepu2560/repos?per_page=1000&type=public"
      );
      const data = await res.json();
      setPracticeProjects(data.length);
    } catch (error) {
      console.error("Error fetching practice projects:", error);
    }
  };

  useEffect(() => {
    fetchPracticeProjects();
  }, []);

  useEffect(() => {
    if (socialList.length == 0) dispatch(fetchSocials());
  }, [socialList, dispatch]);

  return (
    <div className="w-[350px] h-full border-r-2 border-solid bg-footerBgColor border-lightthemebg flex items-center justify-evenly flex-col max-sm:hidden">
      <div className="h-fit w-fit flex items-center justify-center gap-3.5">
        <img
          src="https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/avatar.webp"
          alt="logo"
          className="w-12 aspect-square rounded-full"
          loading="lazy"
        />
        <NameSVG />
      </div>
      <div className="w-fit h-fit flex items-center justify-center gap-2.5">
        <Link
          to={"/"}
          className="text-base font-medium py-2.5 px-5 rounded-full bg-servicesButton active:bg-leadcolor-600 hover:bg-leadcolor-600 text-lightthemebg max-lg:text-sm"
        >
          Home
        </Link>
        <a
          href="https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/Deepanshu_resume.pdf"
          target="_blank"
          className="text-base font-medium py-2.5 px-5 rounded-full bg-servicesButton active:bg-leadcolor-600 hover:bg-leadcolor-600 text-lightthemebg max-lg:text-sm"
        >
          Resume
        </a>
        <Link
          to={"/contact"}
          className="text-base font-medium py-2.5 px-5 rounded-full bg-servicesButton active:bg-leadcolor-600 hover:bg-leadcolor-600 text-lightthemebg max-lg:text-sm"
        >
          Hire Me
        </Link>
      </div>
      <div className="w-11/12">
        <h2 className="text-center text-xl text-leadcolor-600 font-semibold mb-5">
          Projects
        </h2>
        <div className="w-full h-fit flex items-center justify-evenly">
          <div className="flex items-center justify-center gap-2.5 backdrop-blur-sm border-2 border-solid border-[rgba(255, 255, 255, 0.5)] bg-glassmorphism rounded-lg py-1 px-5">
            <div className="w-10 aspect-square bg-lightthemebg rounded-lg flex items-center justify-center -translate-y-6">
              <CloudCheck size={24} />
            </div>
            <span>
              <p className="text-base text-center font-medium text-lightthemebg">
                Live
              </p>
              <p className="text-base text-center text-lightthemebg">10+</p>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2.5 backdrop-blur-sm border-2 border-solid border-[rgba(255, 255, 255, 0.5)] bg-glassmorphism rounded-lg py-1 px-5">
            <div className="w-10 aspect-square bg-lightthemebg rounded-lg flex items-center justify-center -translate-y-6">
              <Code2 size={24} />
            </div>
            <span>
              <p className="text-base text-center font-medium text-lightthemebg">
                Practice
              </p>
              <p className="text-base text-center text-lightthemebg">
                {practiceProjects}+
              </p>
            </span>
          </div>
        </div>
      </div>
      <p className="w-11/12 text-lightthemebg text-base">
        {footerList.footer_description}
      </p>
      <a className="flex items-center justify-start gap-2.5 text-sm font-normal w-11/12">
        <Mail size={20} className="text-lightthemebg" />
        <p className="text-lightthemebg font-normal text-sm">
          {footerList.footer_email}
        </p>
      </a>
      <a className="flex items-center justify-start gap-2.5 text-sm font-normal w-11/12">
        <MapPin size={20} className="text-lightthemebg" />
        <p className="text-lightthemebg font-normal text-sm">
          {footerList.footer_address}
        </p>
      </a>
      <div className="flex items-center justify-start gap-2.5 w-11/12">
        {socialList.map((social) => (
          <a
            href={social.social_link}
            target="_blank"
            rel="noreferrer"
            key={social.social_id}
            title={social.social_title}
          >
            <IconRender
              iconName={social.social_svg}
              color={"var(--color-lightthemebg)"}
            />
          </a>
        ))}
      </div>
      <div className="w-3/4 aspect-square">
        <a
          href="https://linktr.ee/deepanshugulia.in"
          target="_blank"
          className="w-2/5 aspect-square max-lg:w-2/3"
        >
          <img
            src={footerList.footer_qr_svg}
            alt="linktree qr code"
            width={"100%"}
            height={"100%"}
          />
        </a>
      </div>
      <p className="w-fit text-lightthemebg font-normal text-xs">
        Copyright © 2023 Deepanshu. All Rights Reserved.
      </p>
    </div>
  );
};
