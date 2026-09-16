import React from "react";
import { IconSVGType } from "../types";

export const QuoteSVG: React.FC<IconSVGType> = ({ size = 24, ...props }) => {
  return (
    <svg
      width={size + "px"}
      height={size + "px"}
      {...props}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.135 17.445H5.1C5.22 10.44 6.6 9.28502 10.905 6.73502C11.4 6.43502 11.565 5.80502 11.265 5.29502C10.98 4.80002 10.335 4.63502 9.84 4.93502C4.77 7.93502 3 9.76502 3 18.48V26.565C3 29.13 5.085 31.2 7.635 31.2H12.135C14.775 31.2 16.77 29.205 16.77 26.565V22.065C16.77 19.44 14.775 17.445 12.135 17.445Z"
        className="fill-quoteColor dark:fill-quoteColordark"
      />
      <path
        d="M28.3648 17.445H21.3298C21.4498 10.44 22.8298 9.28502 27.1348 6.73502C27.6298 6.43502 27.7948 5.80502 27.4948 5.29502C27.1948 4.80002 26.5648 4.63502 26.0548 4.93502C20.9848 7.93502 19.2148 9.76502 19.2148 18.495V26.58C19.2148 29.145 21.2998 31.215 23.8498 31.215H28.3498C30.9898 31.215 32.9848 29.22 32.9848 26.58V22.08C32.9998 19.44 31.0048 17.445 28.3648 17.445Z"
        className="fill-quoteColor dark:fill-quoteColordark"
      />
    </svg>
  );
};
