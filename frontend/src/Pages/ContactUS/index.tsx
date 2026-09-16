import { ProjectPageAboutMe } from "../ProjectPage/Component/ProjectPageAboutMe";
import { Link } from "react-router-dom";
import { Footer } from "@/Layouts/Footer";

export default function ContactUS() {
  return (
    <div className="bg-lightthemebg relative h-dvh flex items-center justify-between max-sm:h-fit max-sm:flex-col max-sm:gap-2.5">
      <ProjectPageAboutMe />
      <div className="border-2 border-solid border-darkthemebg w-10/12 h-fit bg-lightthemebg py-2.5 px-10 rounded-full flex items-center justify-around gap-2.5 absolute z-50 top-3 left-1/2 -translate-x-1/2 lg:hidden">
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
      </div>
      <div className="w-3/4 h-[90vh] overflow-auto flex items-center justify-evenly gap-y-20 flex-wrap max-sm:mt-24 max-sm:w-11/12 max-sm:mx-auto">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSdSu1bk3Avhp5XsnZQYv0y_wt4s7LvTxcayhL6nEEaeXGZ0rg/viewform?embedded=true"
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
        >
          Loading…
        </iframe>
      </div>
      <span className="sm:hidden">
        <Footer />
      </span>
    </div>
  );
}
