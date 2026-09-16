import { Link } from "react-router-dom";

export const HireMeButton = () => {
  return (
    <Link
      to="/contact"
      className="py-5 px-10 rounded-full font-semibold text-xl bg-leadcolor-600 text-lightthemebg hover:underline max-lg:text-base max-lg:py-2.5 max-lg:px-5"
    >
      Hire Me
    </Link>
  );
};
