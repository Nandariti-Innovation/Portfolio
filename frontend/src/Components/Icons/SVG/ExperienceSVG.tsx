import React from "react";
import { IconSVGType } from "../types";

export const NavExperienceSVG: React.FC<IconSVGType> = ({ size, ...props }) => {
  return (
    <svg
      width={size ? size + "px" : "24px"}
      height={size ? size + "px" : "24px"}
      {...props}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.667 3.5L16.667 4.5L16.667 6.5H22.667V20.5H2.66699V6.5H8.66699V4.5L9.66699 3.5H15.667ZM4.66698 13.8563L4.66699 18.5H20.667L20.667 13.8563C18.669 14.428 16.6686 14.7856 14.667 14.9286L14.667 16.5H10.667L10.667 14.9286C8.66536 14.7856 6.66504 14.428 4.66698 13.8563ZM20.667 8.5H4.66699L4.667 11.7703C7.33756 12.5906 10.0033 13 12.667 13C15.3307 13 17.9965 12.5906 20.667 11.7703L20.667 8.5ZM14.667 5.5H10.667V6.5H14.667V5.5Z"
        fill="white"
      />
    </svg>
  );
};
