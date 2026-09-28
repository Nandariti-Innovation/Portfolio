import { ArrowUpRight } from "lucide-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "@/StateManagement/Redux/reduxStore";
import { HomepageSectionHeading } from "./HomepageSectionHeading";
import { isValidTemplate, slotValue, type DynamicSection, type TemplateDefinition, type TemplateSlot } from "@/features/homepageSections/templates";
import { VisualTemplate } from "@/features/homepageSections/puckTemplates";

const storage = "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/";
const asText = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";
const asTags = (value: unknown) => Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
const dateLabel = (value: unknown) => {
  const date = new Date(asText(value));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};
const imageUrl = (value: unknown) => {
  const source = asText(value);
  if (!source) return "";
  try {
    const url = new URL(source);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return /^[a-z]+:/i.test(source) || source.startsWith("/") ? "" :
      storage + source.split("/").map(encodeURIComponent).join("/");
  }
};
const safeLink = (value: unknown) => {
  const url = asText(value);
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try { const parsed = new URL(url); return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : ""; }
  catch { return ""; }
};

export const DynamicSections = () => {
  const { sections, templates } = useSelector((state: RootState) => state.homepageSections);
  return <>{sections.map((section) => {
    const template = templates[section.template_key];
    if (!template || !isValidTemplate(template)) return null;
    return <DynamicSectionView key={section.section_key} section={section} template={template} />;
  })}</>;
};

export const DynamicSectionView = ({ section, template }: { section: DynamicSection; template: TemplateDefinition }) => {
  if (template.layout_definition.variant === "puck") {
    const id = section.section_key === "project" ? "projects" : section.section_key;
    return <section className="panel content-panel" id={id} aria-label={section.heading.title}>
      <VisualTemplate section={section} layout={template.layout_definition}/>
    </section>;
  }
  const { variant, fields, show_heading, columns = 3 } = template.layout_definition;
  const enabled = (slot: TemplateSlot) => fields.includes(slot);
  const value = (item: Record<string, unknown>, slot: TemplateSlot) => slotValue(item, section.field_bindings[slot]);
  const title = (item: Record<string, unknown>) => asText(value(item, "title"));
  const link = (item: Record<string, unknown>) => enabled("link") ? safeLink(value(item, "link")) : "";
  const id = section.section_key === "project" ? "projects" : section.section_key;

  return <section className="panel content-panel" id={id} aria-label={!show_heading ? section.heading.title : undefined}>
    {show_heading && <HomepageSectionHeading section={section} />}
    {variant === "cards" && <>
      <div className={`grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 ${columns === 2 ? "" : "xl:grid-cols-3"}`}>
        {section.items.map((item, index) => {
          const href = link(item);
          const picture = enabled("image") ? imageUrl(value(item, "image")) : "";
          const content = <>
            <div className="relative aspect-[4/5] overflow-hidden border-b border-white/10 bg-[#171717]">
              {picture ? <img src={picture} width={400} height={500} loading="lazy" decoding="async" alt={`${title(item)} preview`} className="block size-full object-contain"/> :
                <div className="grid size-full place-items-center bg-[#302117] px-6 text-center font-serif text-3xl">{title(item)}</div>}
              <span className="absolute left-4 top-4 border border-white/20 bg-[#080808]/90 px-3 py-2 font-mono text-[10px] text-[#ff6b24]">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="flex flex-1 flex-col p-5 xl:p-7">
              {enabled("category") && <p className="m-0 font-mono text-[10px] uppercase text-[#ff6b24]">{asText(value(item, "category"))}</p>}
              <h3 className="mb-3 mt-3 break-words font-serif text-[clamp(1.6rem,2.3vw,2.25rem)]">{title(item)}</h3>
              {enabled("description") && <p className="mb-5 line-clamp-3 text-[13px] leading-6 text-[#aaa7a2]">{asText(value(item, "description"))}</p>}
              {enabled("tags") && <div className="mb-5 flex flex-wrap gap-2">{asTags(value(item, "tags")).slice(0, 4).map(tag => <span key={tag} className="border border-white/10 px-2.5 py-1.5 font-mono text-[9px]">{tag}</span>)}</div>}
              {href && <span className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px]">View details <ArrowUpRight size={17}/></span>}
            </div>
          </>;
          const classes = "group flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/15 bg-[#101010]/95 text-[#f2efe9] !no-underline transition-colors hover:border-[#ff6b24]/60";
          return href.startsWith("/") ? <Link key={String(item.id ?? index)} className={classes} to={href}>{content}</Link> :
            href ? <a key={String(item.id ?? index)} className={classes} href={href} rel="noopener noreferrer">{content}</a> :
            <article key={String(item.id ?? index)} className={classes}>{content}</article>;
        })}
      </div>
      {section.section_key === "project" && <div className="mt-10 border-t border-white/20 pt-7"><Link to="/projects" className="text-[#ff6b24]">View all projects <ArrowUpRight size={16} className="inline"/></Link></div>}
    </>}
    {variant === "timeline" && <div className="timeline">{section.items.map((item, index) => <article key={String(item.id ?? index)}>
      {enabled("date") && <span>{dateLabel(value(item, "date"))}{enabled("end_date") ? ` - ${dateLabel(value(item, "end_date")) || "Now"}` : ""}</span>}
      <div><h3>{title(item)}</h3>{enabled("subtitle") && <p className="accent">{asText(value(item, "subtitle"))}</p>}
        {enabled("description") && <p>{asText(value(item, "description"))}</p>}
        {enabled("tags") && <div className="skill-list">{asTags(value(item, "tags")).map(tag => <span key={tag}>{tag}</span>)}</div>}
      </div>
    </article>)}</div>}
    {variant === "list" && <div className="post-list">{section.items.map((item, index) => {
      const href = link(item);
      const content = <>{enabled("date") && <span>{dateLabel(value(item, "date"))}</span>}
        {enabled("category") && <p>{Array.isArray(value(item, "category")) ? asTags(value(item, "category"))[0] : asText(value(item, "category"))}</p>}
        <h3>{title(item)}</h3>{href && <ArrowUpRight aria-hidden="true"/>}</>;
      return <article key={String(item.id ?? index)}>{href.startsWith("/") ? <Link to={href} className="contents">{content}</Link> :
        href ? <a href={href} rel="noopener noreferrer" className="contents">{content}</a> : content}</article>;
    })}</div>}
  </section>;
};
