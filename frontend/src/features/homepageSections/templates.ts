import type { FieldBinding, SectionFieldType, SectionHeading } from "./manifest";

export const TEMPLATE_SLOTS = {
  title: "text", subtitle: "text", description: "text", category: "text",
  image: "image", date: "date", end_date: "date", tags: "list", link: "link",
} as const;
export type TemplateSlot = keyof typeof TEMPLATE_SLOTS;
export type TemplateVariant = "cards" | "timeline" | "list";
export type BindingMode = "static" | "dynamic";
export type CardPreset = "project" | "experience" | "blog";

export type TemplateNode = { type: string; props: Record<string, unknown> };
export type PuckLayoutData = { content: TemplateNode[]; root: Record<string, unknown> };
export type TemplateDependency = { field: string; type: SectionFieldType | "unknown" };
export type CollectionQuery = {
  source_section: string;
  preset: CardPreset;
  limit: number;
  order_by: string;
  order_direction: "asc" | "desc";
};

export type VisualLayoutV1 = {
  variant: "puck";
  schema_version: 1;
  show_heading: boolean;
  fields: string[];
  puck_data: PuckLayoutData;
};

export type VisualLayoutV2 = {
  variant: "puck";
  schema_version: 2;
  show_heading: boolean;
  fields: string[];
  dependencies: { section_key: string; fields: TemplateDependency[] };
  collection: CollectionQuery;
  puck_data: PuckLayoutData;
};

export type VisualLayout = VisualLayoutV1 | VisualLayoutV2;

export type TemplateDefinition = {
  template_key: string;
  display_name: string;
  description: string;
  layout_key: string;
  layout_definition: { variant: TemplateVariant; show_heading: boolean; columns?: number; fields: TemplateSlot[] } | VisualLayout;
  slots: { key: string; type: string; required: boolean }[];
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

const identifier = /^[a-z][a-z0-9_]{0,63}$/;

export function isValidTemplate(value: TemplateDefinition) {
  const layout = value.layout_definition;
  if (layout?.variant === "puck") {
    const data = layout.puck_data;
    if (!data || !Array.isArray(data.content) || data.content.length > 120 || JSON.stringify(layout).length > 131072 || !Array.isArray(value.slots)) return false;
    if (layout.schema_version === 2) {
      const query = layout.collection;
      return typeof layout.show_heading === "boolean" && !!layout.dependencies && identifier.test(layout.dependencies.section_key) &&
        Array.isArray(layout.dependencies.fields) && layout.dependencies.fields.length > 0 && layout.dependencies.fields.length <= 64 &&
        layout.dependencies.fields.every((entry) => identifier.test(entry.field) && typeof entry.type === "string") && !!query &&
        identifier.test(query.source_section) && query.source_section === layout.dependencies.section_key && ["project", "experience", "blog"].includes(query.preset) &&
        Number.isInteger(query.limit) && query.limit >= 1 && query.limit <= 12 && identifier.test(query.order_by) &&
        ["asc", "desc"].includes(query.order_direction);
    }
    return layout.schema_version === 1 && typeof layout.show_heading === "boolean" && Array.isArray(layout.fields) &&
      layout.fields.length > 0 && layout.fields.length <= 32 && layout.fields.every((field) => identifier.test(field)) &&
      value.slots.every((slot) => identifier.test(slot.key) && ["text", "image", "date", "list", "link"].includes(slot.type));
  }
  return !!layout && ["cards", "timeline", "list"].includes(layout.variant) &&
    typeof layout.show_heading === "boolean" && Array.isArray(layout.fields) && layout.fields.length > 0 && layout.fields.length <= 9 &&
    layout.fields.every((slot) => slot in TEMPLATE_SLOTS) && Array.isArray(value.slots) && value.slots.some((slot) => slot.key === "title");
}

export function validBinding(binding: FieldBinding | undefined, fields: string[]) {
  if (typeof binding === "string") return fields.includes(binding);
  return !!binding && fields.includes(binding.field) && binding.prefix.startsWith("/") && !binding.prefix.startsWith("//");
}

export function slotValue(item: Record<string, unknown>, binding: FieldBinding | undefined): unknown {
  if (!binding) return null;
  if (typeof binding === "string") return item[binding];
  return binding.prefix + encodeURIComponent(String(item[binding.field] ?? ""));
}

export function bindingValue(
  item: Record<string, unknown>,
  mode: unknown,
  staticValue: unknown,
  field: unknown,
  prefix: unknown = "",
  suffix: unknown = "",
) {
  if (mode !== "dynamic") return staticValue;
  if (typeof field !== "string" || !identifier.test(field)) return "";
  const value = item[field];
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value;
  return `${typeof prefix === "string" ? prefix : ""}${String(value)}${typeof suffix === "string" ? suffix : ""}`;
}
