import React from "react";
import { IconSVGType } from "../types";

export const NavContactSVG: React.FC<IconSVGType> = ({ size, ...props }) => {
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
        d="M22.667 4.5V20.5H2.66699V4.5H22.667ZM20.667 6.5H4.66699V18.5H20.667V6.5ZM18.667 14.5V16H13.667V14.5H18.667ZM9.54199 11.8C10.987 11.8 12.167 13 12.167 14.5H6.16699C6.16699 13 7.34225 11.8 8.79199 11.8H9.54199ZM18.667 11.5V13H13.667V11.5H18.667ZM9.16699 8.1856C9.89187 8.1856 10.4795 8.77323 10.4795 9.4981C10.4795 10.223 9.89187 10.8106 9.16699 10.8106C8.44212 10.8106 7.85449 10.223 7.85449 9.4981C7.85449 8.77323 8.44212 8.1856 9.16699 8.1856ZM18.667 8.5V10H13.667V8.5H18.667Z"
        fill="white"
      />
    </svg>
  );
};
