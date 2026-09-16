import { useEffect, useState, type ReactNode } from "react";
import { settingContext } from "./SettingContext";

export const SettingContextProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("dashboard-sidebar-collapsed") === "true");
  const [darkTheme, setDarkTheme] = useState(() => {
    const stored = localStorage.getItem("dashboard-theme");
    return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkTheme);
    localStorage.setItem("dashboard-theme", darkTheme ? "dark" : "light");
  }, [darkTheme]);

  useEffect(() => {
    localStorage.setItem("dashboard-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return <settingContext.Provider value={{
    collapsed,
    darkTheme,
    mobileOpen,
    handleDarkTheme: setDarkTheme,
    handleCollapsed: setCollapsed,
    handleMobileOpen: setMobileOpen,
  }}>{children}</settingContext.Provider>;
};
