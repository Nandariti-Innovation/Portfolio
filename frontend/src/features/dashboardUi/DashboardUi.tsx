import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type DashboardUiState = {
  collapsed: boolean;
  darkTheme: boolean;
  mobileOpen: boolean;
  setCollapsed: (value: boolean) => void;
  setDarkTheme: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
};

const DashboardUiContext = createContext<DashboardUiState | null>(null);

export function DashboardUiProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("dashboard-sidebar-collapsed") === "true",
  );
  const [darkTheme, setDarkTheme] = useState(() => {
    const stored = localStorage.getItem("dashboard-theme");
    return stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkTheme);
    localStorage.setItem("dashboard-theme", darkTheme ? "dark" : "light");
  }, [darkTheme]);

  useEffect(() => {
    localStorage.setItem("dashboard-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <DashboardUiContext.Provider
      value={{ collapsed, darkTheme, mobileOpen, setCollapsed, setDarkTheme, setMobileOpen }}
    >
      {children}
    </DashboardUiContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDashboardUi() {
  const value = useContext(DashboardUiContext);
  if (!value) throw new Error("DashboardUiProvider is missing");
  return value;
}
