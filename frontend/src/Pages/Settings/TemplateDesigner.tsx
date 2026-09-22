import { useMemo, useState } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import supabase from "@/Superbase/client";
import type {
  TemplateDefinition,
  DynamicSection,
} from "@/features/homepageSections/templates";
import {
  analyzeTemplate,
  asPuckLayout,
  createTemplateConfig,
  type PuckTemplateData,
} from "@/features/homepageSections/puckTemplates";

type SectionTemplate = TemplateDefinition & {
  reference_section_key: string | null;
  display_fields: string[];
};

const input =
  "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900";

export function TemplateDesigner({
  original,
  onClose,
  onSaved,
}: {
  original: SectionTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [key, setKey] = useState(original?.template_key || "");
  const [name, setName] = useState(original?.display_name || "");
  const [description, setDescription] = useState(original?.description || "");
  const [published, setPublished] = useState(original?.is_published ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initial = useMemo(() => asPuckLayout(original), [original]);
  const sample: DynamicSection = useMemo(
    () => ({
      section_key: "template_preview",
      heading: {
        index: "01",
        eyebrow: "YOUR SECTION",
        title: "A reusable section layout",
      },
      order: 1,
      template_key: "template_preview",
      field_bindings: Object.fromEntries(
        [
          "title",
          "subtitle",
          "description",
          "category",
          "image",
          "date",
          "tags",
          "link",
        ].map((slot) => [slot, slot]),
      ),
      items: [
        {
          title: "First example item",
          subtitle: "A supporting line",
          description:
            "This is sample content. Connect slots to the section’s table fields in Headings.",
          category: "FEATURED",
          date: "2026-09-22",
          tags: ["React", "Design"],
          link: "/projects",
        },
      ],
    }),
    [],
  );
  const config = useMemo(() => createTemplateConfig(sample), [sample]);
  const save = async (data: PuckTemplateData) => {
    if (
      !/^[a-z][a-z0-9_]{0,63}$/.test(key) ||
      !name.trim() ||
      !description.trim() ||
      name.trim().length > 120 ||
      description.trim().length > 500
    ) {
      setError("Provide a valid key, name, and description before publishing.");
      return;
    }
    let slots: ReturnType<typeof analyzeTemplate>;
    try {
      slots = analyzeTemplate(data);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Invalid layout.");
      return;
    }
    setBusy(true);
    setError("");
    const definition = {
      variant: "puck",
      schema_version: 1,
      show_heading: data.content.some((node) => node.type === "SectionHeading"),
      fields: slots.map((slot) => slot.key),
      puck_data: data,
    };
    const patch = {
      display_name: name.trim(),
      description: description.trim(),
      layout_key: "puck",
      display_fields: slots.map((slot) => slot.key),
      layout_definition: definition,
      slots,
      is_published: published,
      updated_at: new Date().toISOString(),
    };
    const result = original
      ? await supabase
          .from("section_templates")
          .update(patch)
          .eq("template_key", key)
          .select("template_key")
          .single()
      : await supabase
          .from("section_templates")
          .insert({ ...patch, template_key: key, is_builtin: false })
          .select("template_key")
          .single();
    if (result.error) setError(result.error.message);
    else onSaved();
    setBusy(false);
  };
  return (
    <div className="p-4 dark:text-white">
      <h2 className="text-lg font-semibold">
        {original
          ? `Edit ${original.display_name}`
          : "Create a reusable template"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Drag blocks onto the canvas, design an item inside Repeating items, and
        preview mobile, tablet, and desktop. Publish to save.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
        <label className="text-sm">
          Template key
          <input
            className={input}
            value={key}
            disabled={!!original}
            maxLength={64}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Display name
          <input
            className={input}
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Description
          <input
            className={input}
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>
      <div className="my-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Data slots are mapped to table columns in Settings → Headings after
          publishing.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Available on homepage
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Close designer
        </button>
      </div>
      <div className="overflow-auto rounded-xl border border-gray-300 text-gray-900 dark:border-gray-600">
        <Puck
          config={config}
          data={initial.puck_data as PuckTemplateData}
          // height="max(420px, calc(100dvh - 260px))"
          onPublish={async (data) => {
            if (!busy) await save(data);
          }}
        />
      </div>
    </div>
  );
}
