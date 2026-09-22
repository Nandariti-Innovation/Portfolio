import type { FieldBinding, SectionHeading } from "./manifest";

export const TEMPLATE_SLOTS = {
  title: "text", subtitle: "text", description: "text", category: "text",
  image: "image", date: "date", end_date: "date", tags: "list", link: "link",
} as const;
export type TemplateSlot = keyof typeof TEMPLATE_SLOTS;
export type TemplateVariant = "cards" | "timeline" | "list";

export type TemplateDefinition = {
  template_key: string;
  display_name: string;
  description: string;
  layout_key: string;
  layout_definition: { variant: TemplateVariant; show_heading: boolean; columns?: number; fields: TemplateSlot[] };
  slots: { key: TemplateSlot; type: string; required: boolean }[];
  is_builtin: boolean;
  is_published: boolean;
};

export type DynamicSection = {
  section_key: string;
  heading: SectionHeading;
  order: number;
  template_key: string;
  field_bindings: Record<string, FieldBinding>;
  items: Record<string, unknown>[];
};

export type DynamicHomepage = { sections: DynamicSection[]; templates: Record<string, TemplateDefinition> };

export function isValidTemplate(value: TemplateDefinition) {
  const layout = value.layout_definition;
  return !!layout && ["cards", "timeline", "list"].includes(layout.variant) &&
    typeof layout.show_heading === "boolean" && Array.isArray(layout.fields) &&
    layout.fields.length > 0 && layout.fields.length <= 9 &&
    layout.fields.every((slot) => slot in TEMPLATE_SLOTS) &&
    Array.isArray(value.slots) && value.slots.some((slot) => slot.key === "title");
}

export function validBinding(binding: FieldBinding | undefined, fields: string[]) {
  if (typeof binding === "string") return fields.includes(binding);
  return !!binding && fields.includes(binding.field) &&
    binding.prefix.startsWith("/") && !binding.prefix.startsWith("//");
}

export function slotValue(item: Record<string, unknown>, binding: FieldBinding | undefined): unknown {
  if (!binding) return null;
  if (typeof binding === "string") return item[binding];
  return binding.prefix + encodeURIComponent(String(item[binding.field] ?? ""));
}
