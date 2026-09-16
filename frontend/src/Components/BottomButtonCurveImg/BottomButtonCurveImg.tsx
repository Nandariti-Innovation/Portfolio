import React from "react";
import { UpRightLinkSVG } from "./UpRightLinkSVG";

interface bottomButtonCurvingPropType {
  imgURL: string;
  inheritClr: string;
  outlineClassCss: string;
}

export const BottomButtonCurveImg: React.FC<bottomButtonCurvingPropType> = ({
  imgURL,
  inheritClr,
  outlineClassCss,
}) => {
  return (
    <div
      className="relative w-full h-full rounded-3xl cursor-pointer"
      style={
        {
          "--bottombuttoncurveimg-button-bg-color": inheritClr,
        } as React.CSSProperties & Record<string, string>
      }
    >
      <div className="bottombuttoncurveimg_img w-full h-full overflow-hidden rounded-t-3xl rounded-b-2xl">
        <img
          src={imgURL}
          alt="reload something went wrong!"
          className="w-full h-full group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <button
        className={`absolute bottom-0 right-0 bg-servicesButton rounded-full p-5 outline-[20px] ${outlineClassCss} z-20 -outline-offset-1 group-hover:bg-leadcolor-600`}
      >
        <UpRightLinkSVG />
      </button>
    </div>
  );
};
