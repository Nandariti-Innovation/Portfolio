import type { SettingsType } from "@/StateManagement/Redux/@types";
import headingManifestV2 from "./headingManifestV2.json";

export const SECTION_FIELD_TYPES = [
  "string",
  "text",
  "rich_text",
  "integer",
  "number",
  "boolean",
  "url",
  "date",
  "datetime",
  "image",
  "string_array",
  "uuid",
] as const;

export const SECTION_INPUT_TYPES = [
  "text",
  "textarea",
  "rich_text",
  "number",
  "checkbox",
  "url",
  "date",
  "datetime-local",
  "image",
  "tags",
  "repeater",
  "select",
] as const;

export const REGISTERED_SECTION_TEMPLATES = [
  "experience_v1",
  "project_v1",
  "blog_v1",
] as const;

export type SectionFieldType = (typeof SECTION_FIELD_TYPES)[number];
export type SectionInputType = (typeof SECTION_INPUT_TYPES)[number];
export type RegisteredSectionTemplate =
  (typeof REGISTERED_SECTION_TEMPLATES)[number];

export type SectionHeading = {
  index: string;
  eyebrow: string;
  title: string;
};

export type SectionDataField = {
  key: string;
  label: string;
  type: SectionFieldType;
  required: boolean;
  input?: SectionInputType;
  editable?: boolean;
  generated?: boolean;
  nullable?: boolean;
  max_length?: number;
  minimum?: number;
  maximum?: number;
  options?: string[];
};

export type SectionDataSchema = {
  version: number;
  fields: SectionDataField[];
};

export type HomepageSectionConfiguration = {
  section_key: string;
  enabled: boolean;
  order: number;
  heading: SectionHeading;
  template_key: RegisteredSectionTemplate;
  table_name: string;
  data_schema: SectionDataSchema;
};

export type HomepageHeadingManifest = Record<
  string,
  HomepageSectionConfiguration
>;

export type ManifestValidationError = {
  section_key: string;
  field: string;
  message: string;
};

export type ParsedHeadingManifest = {
  manifest: HomepageHeadingManifest;
  sections: HomepageSectionConfiguration[];
  errors: ManifestValidationError[];
};

const identifierPattern = /^[a-z][a-z0-9_]*$/;
const fieldTypes = new Set<string>(SECTION_FIELD_TYPES);
const inputTypes = new Set<string>(SECTION_INPUT_TYPES);
const templateKeys = new Set<string>(REGISTERED_SECTION_TEMPLATES);

export const DEFAULT_HEADING_MANIFEST =
  headingManifestV2 as HomepageHeadingManifest;

export function parseHeadingManifest(value: unknown): ParsedHeadingManifest {
  const errors: ManifestValidationError[] = [];
  const manifest: HomepageHeadingManifest = {};

  if (!isRecord(value) || Object.keys(value).length === 0) {
    return {
      manifest,
      sections: [],
      errors: [error("manifest", "setting_object", "must be a non-empty object")],
    };
  }

  for (const [objectKey, candidate] of Object.entries(value)) {
    const section = parseSection(objectKey, candidate, errors);
    if (section) manifest[objectKey] = section;
  }

  const activeOrders = new Map<number, string>();
  for (const section of Object.values(manifest)) {
    if (!section.enabled) continue;
    const duplicate = activeOrders.get(section.order);
    if (duplicate) {
      errors.push(
        error(
          section.section_key,
          "order",
          `duplicates enabled section ${duplicate}`,
        ),
      );
      delete manifest[section.section_key];
      continue;
    }
    activeOrders.set(section.order, section.section_key);
  }

  return {
    manifest,
    sections: Object.values(manifest).sort((a, b) => a.order - b.order),
    errors,
  };
}

export function resolveHeadingManifest(
  settings: SettingsType[],
): ParsedHeadingManifest {
  const row = settings.find((item) => item.setting_name === "headings");

  if (!row) return parseHeadingManifest(DEFAULT_HEADING_MANIFEST);

  if (row.schema_version === 2) {
    return parseHeadingManifest(row.setting_object);
  }

  return parseHeadingManifest(normalizeLegacyHeadings(row.setting_object));
}

export function getSectionConfiguration(
  settings: SettingsType[],
  sectionKey: "experience" | "project" | "blog",
) {
  return resolveHeadingManifest(settings).manifest[sectionKey];
}

function normalizeLegacyHeadings(value: unknown): HomepageHeadingManifest {
  if (!isRecord(value)) return DEFAULT_HEADING_MANIFEST;

  return Object.fromEntries(
    Object.entries(DEFAULT_HEADING_MANIFEST).map(([sectionKey, defaults]) => {
      const legacy = value[sectionKey];
      const heading = isRecord(legacy)
        ? {
            index: stringOr(legacy.index, defaults.heading.index),
            eyebrow: stringOr(legacy.eyebrow, defaults.heading.eyebrow),
            title: stringOr(legacy.title, defaults.heading.title),
          }
        : defaults.heading;

      return [sectionKey, { ...defaults, heading }];
    }),
  );
}

function parseSection(
  objectKey: string,
  value: unknown,
  errors: ManifestValidationError[],
): HomepageSectionConfiguration | undefined {
  if (!isRecord(value)) {
    errors.push(error(objectKey, "section", "must be an object"));
    return undefined;
  }

  const before = errors.length;
  const sectionKey = readString(value, "section_key", objectKey, errors);
  const enabled = readBoolean(value, "enabled", objectKey, errors);
  const order = readPositiveInteger(value, "order", objectKey, errors);
  const templateKey = readString(value, "template_key", objectKey, errors);
  const tableName = readString(value, "table_name", objectKey, errors);

  if (sectionKey && sectionKey !== objectKey) {
    errors.push(error(objectKey, "section_key", "must match its object key"));
  }
  if (sectionKey && !identifierPattern.test(sectionKey)) {
    errors.push(error(objectKey, "section_key", "has an invalid format"));
  }
  if (templateKey && !templateKeys.has(templateKey)) {
    errors.push(error(objectKey, "template_key", "is not registered"));
  }
  if (tableName && !identifierPattern.test(tableName)) {
    errors.push(error(objectKey, "table_name", "has an invalid format"));
  }

  const heading = parseHeading(value.heading, objectKey, errors);
  const dataSchema = parseDataSchema(value.data_schema, objectKey, errors);

  if (
    errors.length !== before ||
    !sectionKey ||
    enabled === undefined ||
    order === undefined ||
    !heading ||
    !templateKey ||
    !tableName ||
    !dataSchema
  ) {
    return undefined;
  }

  return {
    section_key: sectionKey,
    enabled,
    order,
    heading,
    template_key: templateKey as RegisteredSectionTemplate,
    table_name: tableName,
    data_schema: dataSchema,
  };
}

function parseHeading(
  value: unknown,
  sectionKey: string,
  errors: ManifestValidationError[],
): SectionHeading | undefined {
  if (!isRecord(value)) {
    errors.push(error(sectionKey, "heading", "must be an object"));
    return undefined;
  }

  const before = errors.length;
  const index = readString(value, "index", sectionKey, errors, "heading.index");
  const eyebrow = readString(
    value,
    "eyebrow",
    sectionKey,
    errors,
    "heading.eyebrow",
  );
  const title = readString(value, "title", sectionKey, errors, "heading.title");

  if (index && index.length > 3) {
    errors.push(error(sectionKey, "heading.index", "must be at most 3 characters"));
  }
  if (eyebrow && eyebrow.length > 40) {
    errors.push(
      error(sectionKey, "heading.eyebrow", "must be at most 40 characters"),
    );
  }
  if (title && title.length > 160) {
    errors.push(
      error(sectionKey, "heading.title", "must be at most 160 characters"),
    );
  }

  return errors.length === before && index && eyebrow && title
    ? { index, eyebrow, title }
    : undefined;
}

function parseDataSchema(
  value: unknown,
  sectionKey: string,
  errors: ManifestValidationError[],
): SectionDataSchema | undefined {
  if (!isRecord(value)) {
    errors.push(error(sectionKey, "data_schema", "must be an object"));
    return undefined;
  }

  const version = value.version;
  const fields = value.fields;
  if (!Number.isInteger(version) || (version as number) < 1) {
    errors.push(error(sectionKey, "data_schema.version", "must be a positive integer"));
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    errors.push(error(sectionKey, "data_schema.fields", "must be a non-empty array"));
    return undefined;
  }

  const parsedFields: SectionDataField[] = [];
  const keys = new Set<string>();
  fields.forEach((field, index) => {
    const parsed = parseDataField(field, sectionKey, index, errors);
    if (!parsed) return;
    if (keys.has(parsed.key)) {
      errors.push(
        error(sectionKey, `data_schema.fields.${index}.key`, "must be unique"),
      );
      return;
    }
    keys.add(parsed.key);
    parsedFields.push(parsed);
  });

  return Number.isInteger(version) && parsedFields.length === fields.length
    ? { version: version as number, fields: parsedFields }
    : undefined;
}

function parseDataField(
  value: unknown,
  sectionKey: string,
  index: number,
  errors: ManifestValidationError[],
): SectionDataField | undefined {
  const path = `data_schema.fields.${index}`;
  if (!isRecord(value)) {
    errors.push(error(sectionKey, path, "must be an object"));
    return undefined;
  }

  const key = value.key;
  const label = value.label;
  const type = value.type;
  const required = value.required;
  const input = value.input;

  if (typeof key !== "string" || !identifierPattern.test(key)) {
    errors.push(error(sectionKey, `${path}.key`, "has an invalid format"));
  }
  if (typeof label !== "string" || !label.trim()) {
    errors.push(error(sectionKey, `${path}.label`, "must be a non-empty string"));
  }
  if (typeof type !== "string" || !fieldTypes.has(type)) {
    errors.push(error(sectionKey, `${path}.type`, "is not supported"));
  }
  if (typeof required !== "boolean") {
    errors.push(error(sectionKey, `${path}.required`, "must be a boolean"));
  }
  if (input !== undefined && (typeof input !== "string" || !inputTypes.has(input))) {
    errors.push(error(sectionKey, `${path}.input`, "is not supported"));
  }

  for (const property of ["editable", "generated", "nullable"] as const) {
    if (value[property] !== undefined && typeof value[property] !== "boolean") {
      errors.push(error(sectionKey, `${path}.${property}`, "must be a boolean"));
    }
  }

  for (const property of ["max_length", "minimum", "maximum"] as const) {
    if (value[property] !== undefined && typeof value[property] !== "number") {
      errors.push(error(sectionKey, `${path}.${property}`, "must be a number"));
    }
  }

  if (
    value.options !== undefined &&
    (!Array.isArray(value.options) ||
      value.options.some((option) => typeof option !== "string"))
  ) {
    errors.push(error(sectionKey, `${path}.options`, "must be a string array"));
  }

  if (
    typeof key !== "string" ||
    !identifierPattern.test(key) ||
    typeof label !== "string" ||
    !label.trim() ||
    typeof type !== "string" ||
    !fieldTypes.has(type) ||
    typeof required !== "boolean"
  ) {
    return undefined;
  }

  return value as SectionDataField;
}

function readString(
  value: Record<string, unknown>,
  key: string,
  sectionKey: string,
  errors: ManifestValidationError[],
  field = key,
) {
  const result = value[key];
  if (typeof result !== "string" || !result.trim()) {
    errors.push(error(sectionKey, field, "must be a non-empty string"));
    return undefined;
  }
  return result.trim();
}

function readBoolean(
  value: Record<string, unknown>,
  key: string,
  sectionKey: string,
  errors: ManifestValidationError[],
) {
  const result = value[key];
  if (typeof result !== "boolean") {
    errors.push(error(sectionKey, key, "must be a boolean"));
    return undefined;
  }
  return result;
}

function readPositiveInteger(
  value: Record<string, unknown>,
  key: string,
  sectionKey: string,
  errors: ManifestValidationError[],
) {
  const result = value[key];
  if (!Number.isInteger(result) || (result as number) < 1) {
    errors.push(error(sectionKey, key, "must be a positive integer"));
    return undefined;
  }
  return result as number;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function error(
  sectionKey: string,
  field: string,
  message: string,
): ManifestValidationError {
  return { section_key: sectionKey, field, message };
}
