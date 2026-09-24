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
  "section_key": "sample_section",
  "enabled": false,
  "order": 4,
  "heading": {
    "index": "05",
    "eyebrow": "SAMPLE",
    "title": "A sample heading."
  },
  "template_key": null,
  "table_name": "sample_section",
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
        "label": "Name",
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
| `template_key` | Selects a registered React template; `null` until assigned |
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
- Non-null template keys must exist in the frontend template registry; an enabled section must have a template.
- `data_schema.fields` must be non-empty and use unique field keys.
- Invalid sections are reported and skipped independently.

Legacy schema-v1 headings are normalized in memory during rollout. The compatibility layer can be removed after schema v2 is deployed and verified.

## Database and security boundary

Every new section owns a dedicated Supabase table. The table must exist before the section can be enabled and must include its constraints, indexes and RLS policies.

The manifest is configuration, not executable database code. The browser must not create tables, execute SQL, import component paths, bypass RLS or use an unvalidated table name.

The homepage continues to make one `get_homepage_payload` request. Adding configured tables to that payload belongs to the dynamic homepage RPC sub-task.

## New-section workflow

1. In Settings → Headings, enter a new section key, heading and 1–20 typed data fields.
2. `create_homepage_section` atomically creates its Supabase table and inactive manifest entry with `template_key: null`.
3. Create or select a registered template in a future Settings → Templates feature; create its dashboard content page and extend the homepage payload and Redux as needed.
4. Verify validation, permissions, Redux state and public rendering, then enable the section.

The function requires `app_metadata.portfolio_owner = true` on the signed-in dashboard account. This is server-managed Auth metadata, not user-editable metadata; refresh the session after assigning it. The function must be deployed before the new-section action can succeed. Newly created tables initially grant only the owner access; public read policy comes with the template/data integration, before activation.

## Altering a custom section

Custom sections whose `section_key` and `table_name` match expose **Manage data fields** in Settings → Homepage headings. The editor can change labels and required status, add fields, and—when no template depends on the field—rename, change the type of, or remove fields.

`alter_homepage_section_schema` owns the complete operation. It locks the headings settings row, validates the proposed field list, alters the physical table, updates the manifest, increments `data_schema.version`, and asks PostgREST to reload its schema cache in one transaction. Any failure rolls back both the table and manifest changes.

Safety rules:

- Project, Experience, and Blog schemas remain protected.
- System columns cannot be changed or removed.
- A template-bound field cannot be renamed, retyped, or removed until the template is rebound.
- Populated tables allow only lossless type changes: text-family interchange, integer to number, and date to datetime.
- New required fields are blocked on populated tables. Add them as optional, populate existing rows, then mark them required.
- Setting a field to required is blocked while any row contains `NULL`.
- Removing a field requires an explicit destructive-change confirmation in the dashboard.
- The RPC requires the server-managed `app_metadata.portfolio_owner` claim and is executable only by `authenticated`.

Section deletion and table-name/section-key changes are intentionally outside this workflow.
