import { QuoteSVG } from "@/Components/Icons/SVG/QuoteSVG";
import { RootState } from "@/StateManagement/Redux/reduxStore";
import { YearsOfExperience } from "@/Utils/helperFunc";
import { useState } from "react";
import { useSelector } from "react-redux";

export const HeroSection = () => {
  const { HeroSection } = useSelector((state: RootState) => state.herosection);
  const [moveParallexMeasureX, setMoveParallexMeasureX] = useState(0);
  const [moveParallexMeasureY, setMoveParallexMeasureY] = useState(0);

  function heroFontParallex(event: React.MouseEvent<HTMLDivElement>) {
    const x = window.innerWidth / event.pageX;
    const y = (window.innerWidth / event.pageY) * -1;

    setMoveParallexMeasureX(() => Number(x.toFixed(2)));
    setMoveParallexMeasureY(() => Number(y.toFixed(2)));
  }

  return (
    <div
      className="w-full h-[85svh] mt-[15svh] relative bg-lightthemebg dark:bg-darkthemebg max-lg:h-fit max-lg:flex max-lg:flex-col max-lg:items-center max-lg:justify-center max-lg:gap-2.5 max-lg:mt-32 max-sm:mt-28 overflow-hidden"
      onMouseMove={heroFontParallex}
      id="home"
      style={{
        // @ts-expect-error: Allow custom CSS variables
        "--x-measure": `${
          moveParallexMeasureX * 20 < 200 ? moveParallexMeasureX * 20 : 0
        }px`,
        "--y-measure": `${
          moveParallexMeasureY / 10 > -10 ? moveParallexMeasureY / 10 : 0
        }px`,
      }}
    >
      <div className="w-36 h-16 mx-auto relative flex items-end justify-start z-10">
        <p className="border-2 border-solid border-darkthemebg dark:border-lightthemebg w-28 h-12 rounded-full flex items-center justify-center text-darkthemebg dark:text-lightthemebg">
          Hello
        </p>
        <div className="absolute top-0 right-0">
          <img
            src="/Images/herodecoration.webp"
            alt="hero section decoration"
            loading="lazy"
          />
        </div>
      </div>
      <div className="w-fit h-fit mx-auto parallextext">
        <h2 className="relative text-darkthemebg dark:text-lightthemebg font-semibold w-full text-center text-7xl max-sm:text-4xl max-lg:text-6xl">
          {"I'm"}{" "}
          <span className="text-leadcolor-600">{HeroSection.hero_name}</span>,
          <br />
          {HeroSection.hero_designation}
          <div className="aspect-square w-16 absolute left-[-8%] bottom-[-40%] rotate-180 max-lg:-bottom-12 max-lg:-left-10 max-sm:hidden">
            <img
              src="/Images/herodecoration.webp"
              alt="hero section decoration"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </h2>
      </div>
      <span className="group max-lg:relative max-lg:w-full max-sm:h-[67dvh] max-lg:h-[75dvh]">
        <div className="w-[35vw] h-[40svh] rounded-t-full bg-leadcolor-400 absolute bottom-0 left-1/2 -translate-x-1/2 border-2 border-solid border-leadcolor-100 max-lg:h-1/2 max-lg:w-full"></div>
        <div className="w-[20vw] h-fit absolute bottom-0 left-1/2 -translate-x-1/2 z-10 max-lg:h-fit max-sm:w-10/12 max-lg:w-3/4">
          <img
            src={HeroSection.hero_image}
            alt="my photo hero section"
            className="w-full h-full"
          />
        </div>
        <div className="h-[70vh] w-fit absolute bottom-0 left-1/2 -translate-x-1/2 z-0 transition-all duration-500 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 max-lg:hidden">
          <img
            src="/Images/herobganimation.webp"
            alt="my photo bg hero section"
            className="w-full h-full"
            loading="lazy"
          />
        </div>
      </span>
      <div className="absolute right-20 bottom-1/2 translate-y-1/2 max-lg:right-1/2 max-lg:-translate-x-2/3 max-lg:top-4">
        <span className="w-full flex items-center justify-center">
          {new Array(5).fill(1).map((_, index) => (
            <img
              src="/Images/herostar.webp"
              alt="star"
              className="w-10 h-fit max-sm:w-5"
              loading="lazy"
              key={index}
            />
          ))}
        </span>
        <p className="w-full text-xl font-normal text-right text-quoteColor dark:text-quoteColordark max-sm:text-sm">
          <span className="text-5xl font-bold max-sm:text-xl">
            {YearsOfExperience()}+ years
          </span>{" "}
          <br /> experience
        </p>
      </div>
      <div className="w-fit h-fit absolute left-20 bottom-10 max-lg:static max-lg:mx-auto">
        <div className="w-9 h-fit">
          <QuoteSVG size={36} />
        </div>
        <p className="w-[22vw] text-xl font-medium text-quoteColor  dark:text-quoteColordark max-lg:w-11/12">
          {HeroSection.hero_description}
        </p>
      </div>
      <div
        title="scroll for more..."
        className="w-4 h-14 bg-transparent border-2 border-solid border-navBgColor absolute bottom-2.5 right-10 rounded-full max-lg:hidden cursor-pointer"
        onClick={() => window.scrollTo(0, window.innerHeight - 100)}
      >
        <span className="block w-1.5 h-2.5 bg-leadcolor-400 rounded-full absolute bottom-10 left-1/2 -translate-x-1/2 animate-heroscrollbottom"></span>
      </div>
    </div>
  );
};
