import { DSVG } from "./DSVG";
import { ESVG } from "./ESVG";
import { PSVG } from "./PSVG";
import { ASVG } from "./ASVG";
import { NSVG } from "./NSVG";
import { SSVG } from "./SSVG";
import { HSVG } from "./HSVG";
import { USVG } from "./USVG";

export const NameSVG = () => {
  return (
    <div className="h-fit w-fit flex items-center justify-center gap-1.5 text-darkthemebg dark:text-lightthemebg">
      <DSVG />
      <ESVG />
      <ESVG />
      <PSVG />
      <ASVG />
      <NSVG />
      <SSVG />
      <HSVG />
      <USVG />
    </div>
  );
};
