import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, MoonStar, SunMedium, X } from "lucide-react";
import { NameSVG } from "@/Components/Icons/SVG/NameSVGs/NameSVG";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import { IconRender } from "@/Components/Icons/IconRender";
import { setCurrentNav } from "@/StateManagement/Redux/slices/navbar";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";

function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const { darkTheme, handleDarkTheme } = useContext(settingContext);
  const { navbar_data, currentNav } = useSelector(
    (state: RootState) => state.navbar,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavChange = (name: string) => {
    dispatch(setCurrentNav(name));
    setMobileMenuOpen(false);
  };

  const navItems = navbar_data.filter((item) => item.navbar_is_button);

  const navItemClass = (title?: string) =>
    `inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
      currentNav === title
        ? "bg-leadcolor-600 text-lightthemebg shadow-lg shadow-leadcolor-600/25"
        : "text-slate-600 hover:bg-slate-100 hover:text-darkthemebg dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-lightthemebg"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5 sm:px-4 sm:pt-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-[1.75rem] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0f0b09]/90 dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] sm:px-6 lg:px-8">
        <a
          href="#home"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 shrink-0"
          aria-label="Go to home"
        >
          <span className="flex items-center justify-center rounded-full border border-slate-200/80 bg-white/90 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
            <img
              src="https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/avatar.webp"
              alt="avatar"
              className="h-8 w-8 rounded-full object-cover max-sm:h-7 max-sm:w-7"
              loading="lazy"
            />
          </span>
          <span className="flex items-center justify-center rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/5 dark:ring-white/10 max-sm:px-2 max-sm:py-1 max-sm:scale-75 max-sm:origin-left">
            <NameSVG />
          </span>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          {navItems.map((elem) => (
            <a
              key={elem.navbar_id}
              href={elem.navbar_link ?? "#"}
              className={navItemClass(elem.navbar_title)}
              onClick={() =>
                elem.navbar_title ? handleNavChange(elem.navbar_title) : null
              }
            >
              {elem.navbar_title}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleDarkTheme(!darkTheme)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            aria-label={
              darkTheme ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            {darkTheme ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>

          <Link
            to="/contact"
            className="hidden rounded-full bg-leadcolor-600 px-5 py-3 text-sm font-semibold text-lightthemebg shadow-[0_10px_20px_rgba(255,122,0,0.28)] transition-transform duration-200 hover:-translate-y-0.5 sm:inline-flex"
          >
            Hire Me
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={`mx-auto mt-2 w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 px-4 transition-all duration-200 dark:border-white/10 dark:bg-[#0f0b09]/95 sm:px-6 lg:hidden ${
          mobileMenuOpen
            ? "max-h-96 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
            : "max-h-0 py-0 border-transparent shadow-none"
        }`}
      >
        <div className="flex flex-col gap-2">
          {navItems.map((elem) => (
            <a
              key={elem.navbar_id}
              href={elem.navbar_link ?? "#"}
              className={navItemClass(elem.navbar_title)}
              onClick={() =>
                elem.navbar_title ? handleNavChange(elem.navbar_title) : null
              }
            >
              <span className="flex items-center gap-2">
                {elem.navbar_icon && <IconRender iconName={elem.navbar_icon} />}
                {elem.navbar_title}
              </span>
            </a>
          ))}

          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-1 inline-flex items-center justify-center rounded-full bg-leadcolor-600 px-5 py-3 text-sm font-semibold text-lightthemebg shadow-[0_10px_20px_rgba(255,122,0,0.28)]"
          >
            Hire Me
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
