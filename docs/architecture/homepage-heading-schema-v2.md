# Homepage Heading and Section Schema v2

**Parent requirement:** #10  
**Sub-issue:** #29  
**Database row:** `public.settings` where `setting_name = 'headings'`  
**Schema version:** `settings.schema_version = 2`

## Purpose

Schema v2 turns the headings setting into a manifest for configurable homepage sections.

The manifest contains:

- the existing Project, Experience and Blog sections;
- new sections added in the future;
- heading content, visibility and display order;
- the registered frontend template used to render each section;
- the registered data source used to load each section;
- a declarative description of the section's data fields.

Hero, About and Footer are intentionally outside this setting. Their configuration and rendering will be handled separately.

## Important architecture decision

Project, Experience and Blog are not generic templates for every future section.

Each new section receives its own frontend template when its design is created. For example, a Certifications section uses a template registered as `certifications_v1`, not the existing Project component.

Supabase stores only safe identifiers and declarative metadata. It must never store React component paths, JavaScript, SQL, reducer paths or executable validation expressions.

## Canonical section example

```json
{
  "section_key": "certifications",
  "enabled": false,
  "order": 4,
  "heading": {
    "index": "04",
    "eyebrow": "CERTIFICATIONS",
    "title": "Learning proven through practice."
  },
  "template_key": "certifications_v1",
  "data_source_key": "certifications_v1",
  "data_schema": {
    "version": 1,
    "fields": [
      {
        "key": "id",
        "label": "ID",
        "type": "integer",
        "required": true,
        "editable": false,
        "generated": true
      },
      {
        "key": "name",
        "label": "Certification name",
        "type": "string",
        "input": "text",
        "required": true,
        "max_length": 120
      },
      {
        "key": "url",
        "label": "Certificate URL",
        "type": "url",
        "input": "url",
        "required": false
      },
      {
        "key": "completed_year",
        "label": "Completion year",
        "type": "integer",
        "input": "number",
        "required": true,
        "minimum": 1990,
        "maximum": 2100
      },
      {
        "key": "organization",
        "label": "Issuing organization",
        "type": "string",
        "input": "text",
        "required": true,
        "max_length": 120
      }
    ]
  }
}
```

## Complete headings object

The `setting_object` is an object keyed by each section's stable `section_key`.

```json
{
  "project": {
    "section_key": "project",
    "enabled": true,
    "order": 1,
    "heading": {
      "index": "01",
      "eyebrow": "SELECTED WORK",
      "title": "Systems designed to move."
    },
    "template_key": "project_v1",
    "data_source_key": "projects_v1",
    "data_schema": {
      "version": 1,
      "fields": []
    }
  },
  "experience": {
    "section_key": "experience",
    "enabled": true,
    "order": 2,
    "heading": {
      "index": "02",
      "eyebrow": "EXPERIENCE",
      "title": "Ideas become useful when they ship."
    },
    "template_key": "experience_v1",
    "data_source_key": "experience_v1",
    "data_schema": {
      "version": 1,
      "fields": []
    }
  },
  "blog": {
    "section_key": "blog",
    "enabled": true,
    "order": 3,
    "heading": {
      "index": "03",
      "eyebrow": "FIELD NOTES",
      "title": "Writing from inside the build."
    },
    "template_key": "blog_v1",
    "data_source_key": "blogs_v1",
    "data_schema": {
      "version": 1,
      "fields": []
    }
  },
  "certifications": {
    "section_key": "certifications",
    "enabled": false,
    "order": 4,
    "heading": {
      "index": "04",
      "eyebrow": "CERTIFICATIONS",
      "title": "Learning proven through practice."
    },
    "template_key": "certifications_v1",
    "data_source_key": "certifications_v1",
    "data_schema": {
      "version": 1,
      "fields": [
        {
          "key": "name",
          "label": "Certification name",
          "type": "string",
          "input": "text",
          "required": true
        }
      ]
    }
  }
}
```

The shortened built-in `fields` arrays above are placeholders. Their complete field contracts must be added when their current database models are mapped into schema v2.

## Section properties

| Property | Purpose |
|---|---|
| `section_key` | Stable identity used as the object key, HTML section ID and Redux state key |
| `enabled` | Controls whether the public homepage renders the section |
| `order` | Positive integer used to order enabled homepage sections |
| `heading` | Public heading content shown by the section template |
| `template_key` | Safe identifier for a registered React template |
| `data_source_key` | Safe identifier for a registered homepage data source |
| `data_schema` | Declarative field definitions used by dashboard forms and runtime validation |

### Section key

A section key must:

- be unique;
- match its containing object key;
- start with a lowercase letter;
- contain only lowercase letters, numbers and underscores;
- remain stable after the section is created.

Recommended pattern:

```text
^[a-z][a-z0-9_]*$
```

### Enabled

A new section should remain disabled until all of the following exist:

- its Supabase table and RLS policies;
- its registered data source;
- its homepage RPC response;
- its frontend data type;
- its registered React template;
- its dashboard management page;
- successful validation and testing.

### Order and heading index

`order` controls layout position. `heading.index` is presentation text only.

Changing `heading.index` must not reorder a section. Two enabled sections cannot use the same `order`.

### Template key

`template_key` resolves through an allowlisted frontend registry.

```ts
const sectionTemplateRegistry = {
  project_v1: ProjectSection,
  experience_v1: ExperienceSection,
  blog_v1: BlogSection,
  certifications_v1: CertificationsSection,
};
```

The settings row must not contain a component path. An unknown template key is invalid and must be skipped by the public renderer.

### Data source key

`data_source_key` is a logical registry key, not a raw database table name.

```text
certifications_v1 -> approved certifications query/payload entry
```

The homepage continues to make one call to `get_homepage_payload`. The public renderer must not execute `supabase.from(setting.data_source_key)`.

An unknown data-source key is invalid and must be skipped.

### Redux state

Schema v2 does not store `redux_state_key`.

The unique `section_key` is automatically used as the Redux key:

```ts
state.dynamicSections[section.section_key]
```

This avoids duplicated identifiers becoming inconsistent while still keeping isolated data, loading and error state for every section.

## Data schema

`data_schema` describes a section record for:

- dashboard form generation;
- client-side validation;
- data normalization;
- template prop validation;
- documentation of the table contract.

It does not create or alter database tables. Physical tables must be created through reviewed Supabase SQL migrations.

### Supported field properties

| Property | Required | Purpose |
|---|---:|---|
| `key` | Yes | Stable field identifier |
| `label` | Yes | Human-readable dashboard label |
| `type` | Yes | Logical data type |
| `required` | Yes | Whether a value is mandatory |
| `input` | No | Preferred dashboard input control |
| `editable` | No | Whether an administrator can change the value |
| `generated` | No | Whether the database/application generates the value |
| `max_length` | No | Maximum text length |
| `minimum` | No | Minimum numeric value |
| `maximum` | No | Maximum numeric value |
| `options` | No | Allowlisted choices for select-like fields |

### Initial field types

```text
string
text
rich_text
integer
number
boolean
url
date
datetime
image
tags
```

Types are stored as JSON strings. JavaScript or TypeScript identifiers such as `string`, `number` and `Date` cannot be stored directly in JSON.

A completion year should use `integer`. A complete calendar date should use `date` and the value format `YYYY-MM-DD`.

## Runtime validation

The frontend parser must validate each section independently.

It must check:

- the table column has `schema_version = 2`;
- the setting object is not empty;
- the object key equals `section_key`;
- required heading fields are present;
- order values are positive integers;
- enabled sections have unique order values;
- template and data-source keys are registered;
- data-schema fields have unique valid keys;
- all declared types and input controls are supported;
- required field metadata is present.

One invalid section must not crash or hide every valid section. The parser should report the exact section and field, skip the invalid section publicly and continue rendering the others.

## Security boundary

The settings manifest is configuration, not executable code.

The browser must never:

- generate or run SQL from `data_schema`;
- create a Supabase table from settings;
- dynamically import a component path from settings;
- accept an arbitrary database table name;
- execute JavaScript or validation expressions stored in settings;
- bypass Supabase RLS based on configuration.

New physical tables, RPC changes and RLS policies require reviewed migrations. New custom templates require reviewed frontend code.

## New-section delivery flow

1. Design the section and its data contract.
2. Add the section configuration with `enabled: false`.
3. Create its Supabase migration and RLS policies.
4. Register its approved data source.
5. add its data to `get_homepage_payload`.
6. Create its TypeScript record type.
7. Create and register its custom React template.
8. Add its dashboard content page.
9. Generate or configure its form from `data_schema`.
10. Test public rendering, dashboard CRUD, invalid data and permissions.
11. Change `enabled` to `true`.

## Versioning

The authoritative manifest version is stored only in the table column:

```text
settings.schema_version = 2
```

The root `setting_object` must not contain another `schema_version`.

Individual data contracts may use `data_schema.version`, and registered identifiers may include versions such as `certifications_v1`. This allows a section contract or template to evolve without ambiguously changing an existing identifier.
