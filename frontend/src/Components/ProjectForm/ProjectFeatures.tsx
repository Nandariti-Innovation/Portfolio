import { Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export const ProjectFeatures: React.FC<ProjectFeaturesProps> = ({ updateFeatures, heading, list }) => {
  const [items, setItems] = useState(list.length ? list : [""]);
  useEffect(() => updateFeatures(items), [items]);
  return <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{heading}</label>
      <span className="text-xs text-gray-400">{items.length} item{items.length === 1 ? "" : "s"}</span>
    </div>
    <div className="space-y-2">
      {items.map((item, index) => <div className="relative" key={`${heading}-${index}`}>
        <input type="text" value={item} onChange={(e) => setItems((current) => current.map((value, i) => i === index ? e.target.value : value))} placeholder="Add a concise item" required
          className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-3 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
        <button type="button" aria-label={index === items.length - 1 ? "Add item" : "Remove item"}
          onClick={() => index === items.length - 1 ? setItems((current) => [...current, ""]) : setItems((current) => current.filter((_, i) => i !== index))}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md bg-gray-100 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
          {index === items.length - 1 ? <Plus size={16} /> : <X size={16} />}
        </button>
      </div>)}
    </div>
  </div>;
};

interface ProjectFeaturesProps { updateFeatures: (value: string[]) => void; list: string[]; heading: string; }
