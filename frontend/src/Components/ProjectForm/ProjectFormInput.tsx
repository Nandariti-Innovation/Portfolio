import React from "react";

export const ProjectFormInput: React.FC<ProjectFormInputProps> = ({ heading, placeholder, icon, inputName, projectTitle, updateTitle, isRequired, inputType }) => (
  <div className="space-y-1.5">
    <label htmlFor={inputName} className="block text-sm font-medium text-gray-700 dark:text-gray-200">{heading}</label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</div>
      <input id={inputName} name={inputName} type={inputType || "text"} value={projectTitle} onChange={(e) => updateTitle(e.target.value)} placeholder={placeholder} required={isRequired}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500" />
    </div>
  </div>
);

interface ProjectFormInputProps { heading: string; placeholder: string; inputName: string; icon: React.ReactNode; projectTitle: string; isRequired: boolean; inputType?: string; updateTitle: (value: string) => void; }
