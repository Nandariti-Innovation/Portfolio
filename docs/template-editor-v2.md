# Template Editor V2

## Purpose

The template editor lets a dashboard user build a homepage section without writing React or CSS. A template combines one repeated-card preset with an editable block tree. Every content property can use either a fixed value or a column from a homepage section schema.

The three visual presets are:

- Project cards
- Experience items
- Blog cards

Choosing a preset copies its card structure into the template. It does not lock the structure. Blocks inside the card can then be added, removed, nested, reordered, restyled, or rebound to different columns.

## User workflow

1. Create or select a section schema in **Settings → Homepage headings**. The schema defines its table and available columns.
2. Open **Settings → Section templates** and create or edit a template.
3. Select the **Repeating items** block.
4. Choose a preset, data source, item limit, order column, and direction.
5. Edit the blocks inside the repeated card.
6. Keep **Blocks** selected to edit content. For each editable property, choose **Static** or **Database field**.
7. Switch to **Outline** to edit the selected block's layout and visual design.
8. Publish the template, then assign it to a homepage section.

Example: a `certification` section can use the Blog cards preset. Its Heading can bind to `cert_name`, while a link can use a static label such as “View certificate” and a dynamic destination bound to `cert_url`.

## Repeating items

The collection has these settings:

| Setting | Behavior |
| --- | --- |
| Preset | Copies the Project, Experience, or Blog card structure into the collection. Changing it replaces the current inner card. |
| Data source | Selects any section defined by the headings manifest. |
| Items to show | Restricts the public query to 1–12 records. |
| Order by | Lists sortable columns from the selected source schema. |
| Order direction | Ascending or descending. |
| Layout | Grid, stack, or timeline. |
| Desktop columns | One to four columns. Mobile and tablet behavior remains automatic. |
| Gap | Small, medium, or large responsive spacing. |

Each template must contain exactly one Repeating items block. Dynamic bindings are allowed only inside it.

## Available blocks

- Section heading
- Repeating items
- Container
- Heading
- Subheading
- Paragraph
- Text
- Image
- Tags / list
- Date
- Button
- Link
- Item number
- Divider
- Spacing

## Content and design modes

The left sidebar controls what appears in the selected block's right-hand properties panel:

| Sidebar mode | Right panel contains |
| --- | --- |
| Blocks | Content source, static values, database-column bindings, links, and collection query settings |
| Outline | Width, height, layout, spacing, typography, colours, borders, image appearance, and other visual controls |

The selected block remains selected when switching modes, and both panels edit the same block. Switching modes does not discard values. Blocks with no controls in the active mode show a short empty-state message instead of unrelated settings.

Containers provide the main visual controls: surface, row/column/grid arrangement, gap, horizontal alignment, vertical alignment, and corner radius. Text blocks provide size, weight (lighter, light, regular, medium, or bold), alignment, tone, font family, exact font size, line height, letter spacing, font style, decoration, transformation, wrapping, and paragraph spacing. Images provide positioning, fit, aspect ratio, opacity, filters, overlay colour, and overlay opacity. Buttons and links provide an explicit text-colour control; buttons also provide style and size, while both support target behavior.

Every block and container also exposes **Width** and **Height** controls. Available values are Auto, Fit content, Full (100%), 25%, 33%, 50%, 66%, and 75%. Percentage height requires an ancestor with a defined height; otherwise Auto or Fit content is normally the appropriate choice. Puck's draggable wrapper receives the same dimensions, so row and grid layouts look the same in the editor and on the public homepage.

Every block and container also has visual border controls: border style (none, solid, dashed, dotted, or double), thickness, colour, corner radius, and a Figma-style side picker. The side picker supports any combination of top, right, bottom, and left borders. These values are applied consistently in the editor preview and on the published homepage.

Every block also exposes the following curated design controls:

| Editor control | CSS behavior | Available values |
| --- | --- | --- |
| Inner spacing | `padding` | Linked or individual top/right/bottom/left values: 0, 4, 8, 12, 16, 24, 32, 48px |
| Outer spacing | `margin` | Linked or individual top/right/bottom/left values: 0, 4, 8, 12, 16, 24, 32, 48px |
| Background | `background-color` | None, surface, accent, light, muted |
| Opacity | `opacity` | 25%, 50%, 75%, 100% |
| Overflow | `overflow` | Visible, hidden, auto |
| Aspect ratio | `aspect-ratio` | Auto, square, portrait, 4:3, 16:9 |
| Shadow | `box-shadow` | None, small, medium, large, glow |
| Rotation | `transform: rotate()` | 0°, -5°, 5°, -15°, 15° |
| Position | `position` | Static, relative, absolute, fixed, sticky |
| Position offsets | `top`, `right`, `bottom`, `left` | Auto or curated positive/negative pixel offsets |
| Layer order | `z-index` | Auto, 0, 10, 20, 30, 40, 50 |

Position offsets are ignored by normal CSS flow when Position is Static. Absolute, fixed, and sticky positioning should be used carefully because the block may overlap surrounding content.

Text controls use only the three locally bundled font families: Manrope, Playfair Display, and DM Mono. Exact font sizes are optional; Responsive default preserves the template's existing mobile/desktop type scaling.

Image controls include object position (centre/top/right/bottom/left), fit, five aspect-ratio choices, opacity, brightness, contrast, saturation, grayscale, and a theme-safe overlay with adjustable opacity.

These are intentionally curated controls. Users do not edit raw CSS or breakpoints.

## Static and dynamic values

Bindings are stored per property rather than per block. This allows combinations such as:

- Static button label + dynamic URL
- Dynamic heading + static paragraph
- Dynamic image + dynamic alternative text
- Static link destination + dynamic link label

Dynamic dropdowns show only compatible schema fields. For example, Date accepts date/datetime columns, Tags accepts string arrays or text, and Image accepts image/URL/text fields.

An illustrative V2 block looks like this:

```json
{
  "type": "Button",
  "props": {
    "labelMode": "static",
    "labelValue": "View certificate",
    "hrefMode": "dynamic",
    "hrefField": "cert_url",
    "hrefPrefix": ""
  }
}
```

## Stored template contract

V2 layouts are declarative JSON. No executable code or arbitrary CSS is stored.

```json
{
  "variant": "puck",
  "schema_version": 2,
  "show_heading": true,
  "fields": ["cert_id", "cert_name", "cert_url"],
  "dependencies": {
    "section_key": "certification",
    "fields": [
      { "field": "cert_id", "type": "integer" },
      { "field": "cert_name", "type": "string" },
      { "field": "cert_url", "type": "url" }
    ]
  },
  "collection": {
    "source_section": "certification",
    "preset": "blog",
    "limit": 3,
    "order_by": "cert_id",
    "order_direction": "desc"
  },
  "puck_data": {
    "root": {},
    "content": []
  }
}
```

`dependencies` is derived during publish; the browser does not accept a manually supplied dependency list. It includes dynamic block fields, the ordering field, and a generated identity field when available.

## Validation and security

Frontend publishing validates:

- one collection only;
- supported block types only;
- maximum nesting, block count, and serialized size;
- data source presence in the headings manifest;
- field identifiers and type compatibility;
- limit and ordering values;
- one or more dynamic card bindings.

The database repeats the trust-boundary checks. `get_homepage_sections()` verifies every dependency against the selected source's manifest schema before quoting identifiers into dynamic SQL. Table names are restricted to the three known built-in mappings or a custom table whose name exactly matches its section key. The function remains `SECURITY INVOKER`, so normal RLS policies still apply.

Only requested columns are returned. Built-in publication filters remain enforced (`project_priority` for projects and `status = 'published'` for blogs); custom sections return only `is_visible = true` rows.

## Rendering architecture

The dashboard lazy-loads Puck only when the designer opens. Public pages render the saved JSON with the lightweight `VisualTemplate` renderer and do not download the editor, editor controls, or editor CSS.

Responsive behavior is encoded in the renderer's approved class map:

- containers stack on narrow screens;
- row layouts activate at the small breakpoint;
- grids progress from one column to their approved tablet/desktop layouts;
- typography scales at defined breakpoints;
- images keep their selected aspect ratio and fit.

## Compatibility and migration

Legacy cards/list/timeline layouts and Puck schema version 1 remain readable. Opening an older template in the editor converts its slot mappings to V2 property bindings. The converted layout is persisted only when the user publishes it, providing a safe lazy migration rather than modifying every existing template at deployment time.

The migration `20260923122347_template_builder_v2.sql`:

- extends the template constraint to schema version 2;
- increases the guarded JSON limit for the richer block tree;
- keeps V1 query behavior intact;
- adds the V2 dependency-driven query path;
- preserves public execution grants.

## Operational checklist

After deploying the database migration:

1. Open each built-in template and confirm it converts and previews correctly.
2. Publish each converted template to persist V2.
3. Create a custom section with text, URL, date, image, and list fields.
4. Bind each compatible block type and confirm incompatible fields are absent.
5. Verify static/dynamic combinations for Button, Link, and Image.
6. Confirm grid, stack, and timeline layouts at mobile, tablet, and desktop sizes.
7. Inspect `get_homepage_payload` and confirm only referenced columns are returned.
8. Confirm public pages do not download the Puck bundle.

## Important behavior

- Changing a preset replaces the current inner card and should be treated as a destructive editor action.
- Changing a data source may invalidate existing bindings. Publishing is blocked until every dynamic binding is valid for the new schema.
- Removing or renaming a schema column can invalidate a published template. Update the template before removing the column from the manifest/database.
- Assigning a V2 template in Homepage headings does not expose slot mapping controls because bindings now live inside the template.
