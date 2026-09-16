import { useContext } from "react";
import { HireFormContext } from "@/StateManagement/ContextAPI/HoreFormContext/HireFormContext";

export const UserQueryForm = () => {
  const { toggleForm } = useContext(HireFormContext);
  return (
    <div className="fixed w-screen h-screen flex items-center justify-center z-[99] inset-0">
      <div
        className="absolute w-full h-full bg-[rgba(0,0,0,0.5)]"
        onClick={() => toggleForm(false)}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-[70vh] z-10 overflow-auto">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSdSu1bk3Avhp5XsnZQYv0y_wt4s7LvTxcayhL6nEEaeXGZ0rg/viewform?embedded=true"
          width="100%"
          height="100%"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
};
