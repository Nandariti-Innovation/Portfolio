import { NameSVG } from "@/Components/Icons/SVG/NameSVGs/NameSVG";
import { HireMeButton } from "@/Components/UserQueryForm/HireMeButton";
import { Mail, MapPin } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { IconRender } from "@/Components/Icons/IconRender";
import React from "react";

const todayDate: Date = new Date();

export const Footer: React.FC = () => {
  const { footerList } = useSelector((state: RootState) => state.footer);
  const { socialList } = useSelector((state: RootState) => state.socials);

  return (
    <div className="bg-footerBgColor h-fit w-full overflow-hidden" id="contact">
      <div className="w-5/6 mx-auto py-5 flex items-center justify-between max-lg:flex-col max-lg:py-2.5">
        <h2 className="font-semibold text-6xl text-lightthemebg max-lg:text-4xl">
          Let{"'"}s Connect there
        </h2>
        <HireMeButton />
      </div>
      <hr className="w-5/6 mx-auto my-5 max-lg:my-2.5" />
      <div className="w-5/6 mx-auto flex items-center justify-between max-lg:flex-col-reverse">
        <div>
          <div className="h-full w-fit flex items-center justify-center gap-3.5">
            <img
              src="https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/avatar.webp"
              alt="logo"
              className="w-12 aspect-square rounded-full"
              loading="lazy"
            />
            <NameSVG />
          </div>
          <p className="text-lightthemebg w-3/5 text-xl font-normal max-lg:w-full max-lg:text-base">
            {footerList.footer_description}
          </p>
          <a
            href="mailto:deepanshugulia.work@gmail.com"
            className="flex items-center justify-center gap-2.5 text-xl max-lg:text-base font-normal w-fit my-2.5"
          >
            <Mail size={20} className="text-lightthemebg" />
            <p className="text-lightthemebg font-normal text-xl max-lg:text-base">
              {footerList.footer_email}
            </p>
          </a>
          <a
            href="https://maps.app.goo.gl/y3bwffmjuQMeHf7C8"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2.5 text-xl max-lg:text-base font-normal w-fit my-2.5"
          >
            <MapPin size={20} className="text-lightthemebg" />
            <p className="text-lightthemebg font-normal text-xl max-lg:text-base">
              {footerList.footer_address}
            </p>
          </a>
          <div className="flex items-center justify-center gap-2.5 w-fit">
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
        </div>
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
      <hr className="w-5/6 mx-auto my-5 max-lg:my-2.5" />
      <p className="w-5/6 mx-auto pb-5 text-lightthemebg font-normal text-xl max-lg:text-xs">
        Copyright © {todayDate.getFullYear()} Deepanshu. All Rights Reserved.
      </p>
    </div>
  );
};
