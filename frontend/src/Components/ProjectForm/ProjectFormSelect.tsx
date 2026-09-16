import { ChevronDown } from "lucide-react";
import React from "react";

export const ProjectFormSelect: React.FC<ProjectFormSelectProps> = ({ heading, inputName, icon, list, selectedValue, updateSelect, isRequired }) => (
  <div className="space-y-1.5">
    <label htmlFor={inputName} className="block text-sm font-medium text-gray-700 dark:text-gray-200">{heading}</label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</div>
      <select id={inputName} name={inputName} value={selectedValue} onChange={(e) => updateSelect(e.target.value)} required={isRequired}
        className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
        <option value="">Not selected</option>
        {list.map((item, index) => <option key={`${inputName}-${index}`} value={item}>{item}</option>)}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  </div>
);

interface ProjectFormSelectProps { heading: string; inputName: string; icon: React.ReactNode; list: string[] | number[]; selectedValue: string | number; updateSelect: (value: string) => void; isRequired: boolean; }
