import React from "react";

export const ProjectDescription: React.FC<ProjectDescriptionProps> = ({ projectdescription, updatedescription, heading, placeholder, icon }) => {
  const id = heading.toLowerCase().replace(/\s+/g, "-");
  return <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">{heading}</label>
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-3 text-gray-400">{icon}</div>
      <textarea id={id} value={projectdescription} onChange={(e) => updatedescription(e.target.value)} placeholder={placeholder} rows={4}
        className="w-full resize-y rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500" />
    </div>
  </div>;
};

interface ProjectDescriptionProps { projectdescription: string; heading: string; placeholder: string; icon: React.ReactNode; updatedescription: (value: string) => void; }
