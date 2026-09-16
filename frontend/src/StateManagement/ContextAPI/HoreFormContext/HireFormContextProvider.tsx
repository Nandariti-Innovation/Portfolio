import React, { useState } from "react";
import { HireFormContext } from "./HireFormContext";
interface PropTypes {
  children: React.ReactNode;
}

export const HireFormContextProvider: React.FC<PropTypes> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleForm = (value: boolean) => {
    setIsOpen(() => value);
  };
  return (
    <HireFormContext.Provider value={{ isOpen, toggleForm }}>
      {children}
    </HireFormContext.Provider>
  );
};
