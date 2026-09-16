import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ExternalLink, Github, ImageOff } from "lucide-react";
import type { ProjectItem } from "@/StateManagement/Redux/@types";
import { projectStyles as styles } from "./projectStyles";

const storageUrl = "https://nwacsfxeexspkaspjwjd.supabase.co/storage/v1/object/public/portfolio/";
const externalUrl = (value: string | null | undefined) => {
  if (!value) return undefined;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
};

export const ProjectCard = ({ project, index }: { project: ProjectItem; index: number }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = externalUrl(project.project_image) || (project.project_image
    ? storageUrl + project.project_image.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/") : undefined);
  const live = externalUrl(project.project_link);
  const github = externalUrl(project.project_github);
  const stack = project.project_tech_stack ?? [];
  const detailUrl = project.project_id != null ? `/project/${project.project_id}` : undefined;
  const startDate = project.project_start_date ? new Date(project.project_start_date) : null;
  const year = startDate && Number.isFinite(startDate.getTime()) ? startDate.getFullYear() : null;
  const preview = <>
    {image && !imageFailed ? <img src={image} alt={`${project.project_name} preview`} loading={index < 2 ? "eager" : "lazy"} decoding="async" onError={() => setImageFailed(true)} />
      : <div className={styles.imagePlaceholder}><ImageOff size={32} /><span>{project.project_name}</span></div>}
    <span className={styles.imageShade} />
    <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
    {project.project_status && <span className={styles.status} data-status={project.project_status}><i />{project.project_status}</span>}
    {detailUrl && <span className={styles.previewArrow}><ArrowUpRight size={22} /></span>}
  </>;

  return (
    <article className={styles.card}>
      {detailUrl ? <Link to={detailUrl} className={styles.preview} aria-label={`Read the ${project.project_name} case study`}>{preview}</Link>
        : <div className={styles.preview}>{preview}</div>}
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}><span>{[project.project_type, project.project_company_name].filter(Boolean).join(" / ") || "Project"}</span>{year && <span>{year}</span>}</div>
        <h2 className={styles.cardTitle}>{detailUrl ? <Link to={detailUrl}>{project.project_name}</Link> : project.project_name}</h2>
        <p className={styles.description}>{project.project_description || "Explore the project’s implementation, features and technical decisions."}</p>
        {(project.project_role || project.project_platform) && <dl className={styles.details}>
          {project.project_role && <div><dt>Role</dt><dd>{project.project_role}</dd></div>}
          {project.project_platform && <div><dt>Platform</dt><dd>{project.project_platform}</dd></div>}
        </dl>}
        {stack.length > 0 && <ul className={styles.stack} aria-label="Technologies used">{stack.slice(0, 5).map((tech, i) => <li key={`${tech}-${i}`}>{tech}</li>)}{stack.length > 5 && <li title={stack.slice(5).join(", ")}>+{stack.length - 5} more</li>}</ul>}
        <div className={styles.cardActions}>
          {detailUrl && <Link className={styles.caseStudy} to={detailUrl}>View case study <ArrowUpRight size={16} /></Link>}
          <div>{live && <a href={live} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.project_name} website`}><ExternalLink size={15} />Live site</a>}
            {github && <a href={github} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.project_name} source code`}><Github size={15} />Code</a>}</div>
        </div>
      </div>
    </article>
  );
};
