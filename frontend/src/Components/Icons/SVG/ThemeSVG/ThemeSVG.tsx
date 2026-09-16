import { useContext } from "react";
import { settingContext } from "@/StateManagement/ContextAPI/SettingContext/SettingContext";

export const ThemeSVG = () => {
  const { darkTheme, handleDarkTheme } = useContext(settingContext);

  return (
    <div
      className="sun_moon_container"
      onClick={() => handleDarkTheme(!darkTheme)}
    >
      <div className={`sun ${darkTheme ? "dark" : ""}`}>
        <hr />
        <hr />
        <hr />
        <hr />
      </div>
      <div className={`moon ${!darkTheme ? "dark" : ""}`}></div>
    </div>
  );
};
