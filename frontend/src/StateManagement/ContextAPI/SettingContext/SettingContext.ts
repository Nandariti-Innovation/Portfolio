import { createContext } from "react";

interface ContextTypes {
  collapsed: boolean;
  darkTheme: boolean;
  mobileOpen: boolean;
  handleDarkTheme: (value: boolean) => void;
  handleCollapsed: (value: boolean) => void;
  handleMobileOpen: (value: boolean) => void;
}

export const settingContext = createContext<ContextTypes>({
  collapsed: false,
  darkTheme: false,
  mobileOpen: false,
  handleDarkTheme: () => undefined,
  handleCollapsed: () => undefined,
  handleMobileOpen: () => undefined,
});
