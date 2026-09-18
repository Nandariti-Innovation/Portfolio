# Homepage Heading and Section Schema v2

**Parent requirement:** #10  
**Sub-issue:** #29  
**Database row:** `public.settings` where `setting_name = 'headings'`  
**Schema version:** `settings.schema_version = 2`

## Scope

The v2 headings manifest manages only:

- Experience;
- Project;
- Blog;
- custom homepage sections added later.

Hero, About and Footer/Contact are intentionally outside this setting. About reads its heading from `home_hero.hero_misc.about_section_heading`, while Footer/Contact reads `footer.footer_heading`.

The canonical built-in manifest is maintained in:

```text
frontend/src/features/homepageSections/headingManifestV2.json
```

The matching database migration is:

```text
frontend/supabase/migrations/20260918130000_headings_manifest_v2.sql
```

The canonical file and migration must contain identical JSON.

## Section structure

```json
{
  "section_key": "certifications",
  "enabled": false,
  "order": 4,
  "heading": {
    "index": "05",
    "eyebrow": "CERTIFICATIONS",
    "title": "Learning proven through practice."
  },
  "template_key": "certifications_v1",
  "table_name": "certifications",
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
      }
    ]
  }
}
```

## Property responsibilities

| Property | Responsibility |
|---|---|
| `section_key` | Stable section identity, object key and Redux state key |
| `enabled` | Controls public visibility |
| `order` | Orders configurable homepage sections |
| `heading` | Stores the public index, eyebrow and title |
| `template_key` | Selects a registered React template |
| `table_name` | Names the section's actual Supabase table |
| `data_schema` | Describes the complete table record and dashboard form fields |

There is no `data_source_key` or `redux_state_key`. A section's data source is its declared table, and Redux uses `section_key` automatically.

## Existing built-in sections

| Section | Order | Display index | Template | Table |
|---|---:|---:|---|---|
| Experience | 1 | `02` | `experience_v1` | `work_experience` |
| Project | 2 | `03` | `project_v1` | `projects` |
| Blog | 3 | `04` | `blog_v1` | `blogs` |

`order` controls dynamic-section placement. `heading.index` remains presentation text and follows the complete homepage numbering that includes About.

## Data schema

Each field definition supports:

| Property | Purpose |
|---|---|
| `key` | Exact table/interface field name |
| `label` | Dashboard label |
| `type` | Logical data type |
| `required` | Whether the field requires a value |
| `input` | Dashboard input control |
| `editable` | Whether an administrator can edit it |
| `generated` | Whether the database/application generates it |
| `nullable` | Whether the database value can be null |
| `max_length` | Maximum text length |
| `minimum` / `maximum` | Numeric limits |
| `options` | Allowed select values |

Supported initial field types:

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
string_array
uuid
```

## Validation rules

- The settings row must use `schema_version = 2`.
- The object must not be empty.
- Every object key must equal its `section_key`.
- Identifiers and table names must match `^[a-z][a-z0-9_]*$`.
- `order` must be a positive integer.
- Enabled sections cannot share an order.
- Headings require `index`, `eyebrow` and `title`.
- Template keys must exist in the frontend template registry.
- `data_schema.fields` must be non-empty and use unique field keys.
- Invalid sections are reported and skipped independently.

Legacy schema-v1 headings are normalized in memory during rollout. The compatibility layer can be removed after schema v2 is deployed and verified.

## Database and security boundary

Every new section owns a dedicated Supabase table. The table must exist before the section can be enabled and must include its constraints, indexes and RLS policies.

The manifest is configuration, not executable database code. The browser must not create tables, execute SQL, import component paths, bypass RLS or use an unvalidated table name.

The homepage continues to make one `get_homepage_payload` request. Adding configured tables to that payload belongs to the dynamic homepage RPC sub-task.

## New-section workflow

1. Design the section and its data contract.
2. Add its disabled manifest entry.
3. Create its Supabase table, constraints and RLS policies.
4. Create and register its React template.
5. Include the table's public data in `get_homepage_payload`.
6. Add its dashboard content page and schema-driven form.
7. Verify validation, permissions, Redux state and public rendering.
8. Enable the section.
