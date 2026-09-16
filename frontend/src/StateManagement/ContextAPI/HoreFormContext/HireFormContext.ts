import { createContext } from "react";

interface HireFormContextType {
  isOpen: boolean;
  toggleForm: (value: boolean) => void;
}

const initialState = {
  isOpen: false,
  toggleForm: () => {},
};

export const HireFormContext = createContext<HireFormContextType>(initialState);
