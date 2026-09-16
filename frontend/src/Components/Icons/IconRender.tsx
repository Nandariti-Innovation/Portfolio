import React from "react";
import { CircleHelp } from "lucide-react";
import IconsComponents from "./IconsComponents";

export const IconRender: React.FC<IconRenderProps> = ({
  iconName,
  size = 24,
  ...props
}) => {
  const name = typeof iconName === "string" ? iconName.trim().toLowerCase() : "";
  const key = Object.keys(IconsComponents).find((key) => key.toLowerCase() === name);
  const Icon = key ? IconsComponents[key] : CircleHelp;
  return <Icon size={size} {...props} />;
};

interface IconRenderProps {
  iconName: string;
  size?: number;
  color?: string;
}
