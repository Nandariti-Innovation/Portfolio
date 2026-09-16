import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowUpRight, Search, X } from "lucide-react";
import type { AppDispatch, RootState } from "@/StateManagement/Redux/reduxStore";
import { fetchProjectsList } from "@/StateManagement/Redux/slices/projects";
import { ProjectCard } from "./ProjectCard";
import { projectStyles as styles } from "./projectStyles";
import { useContactModal } from "@/hooks/useContactModal";

const categories = [
  { value: "all", label: "All work" },
  { value: "professional", label: "Professional" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

export default function ProjectsPage() {
  const { projects, loading, error } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch<AppDispatch>();
  const { openContact } = useContactModal();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void dispatch(fetchProjectsList());
  }, [dispatch]);

  const search = query.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesCategory = category === "all" || project.project_type === category;
    const searchable = [project.project_name, project.project_description,
      project.project_company_name, project.project_role, project.project_platform,
      ...(project.project_tech_stack ?? [])].filter(Boolean).join(" ").toLowerCase();
    return matchesCategory && searchable.includes(search);
  });
  const technologies = new Set(projects.flatMap((project) => project.project_tech_stack ?? []));
  const professionalCount = projects.filter((project) => project.project_type === "professional").length;
  const resetFilters = () => { setCategory("all"); setQuery(""); };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/" aria-label="Deepanshu Gulia home">DG<span>.</span></Link>
        <nav className={styles.navigation} aria-label="Portfolio navigation">
          <Link to="/">Home</Link>
          <Link to="/projects" aria-current="page">Projects</Link>
          <button type="button" aria-haspopup="dialog" onClick={openContact} className={styles.contactLink}>Let’s talk <ArrowUpRight size={16} /></button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="projects-title">
          <p className={styles.eyebrow}><span /> THE PROJECT ARCHIVE</p>
          <div className={styles.introRow}>
            <h1 id="projects-title">Ideas into<br /><em>real-world work.</em></h1>
            <div className={styles.introAside}>
              <p>From interfaces to automation. A closer look at the projects I’ve built, the problems behind them, and the tools that made them possible.</p>
              <div className={styles.stats} aria-label="Project collection summary">
                <div><strong>{loading && !projects.length ? "—" : String(projects.length).padStart(2, "0")}</strong><span>Projects</span></div>
                <div><strong>{loading && !projects.length ? "—" : String(professionalCount).padStart(2, "0")}</strong><span>Professional</span></div>
                <div><strong>{loading && !projects.length ? "—" : String(technologies.size).padStart(2, "0")}</strong><span>Technologies</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.collection} aria-label="Browse projects">
          <div className={styles.toolbar}>
            <div className={styles.filters} role="group" aria-label="Filter by project category">
              {categories.filter((item) => item.value === "all" || projects.some((project) => project.project_type === item.value)).map((item) => (
                <button key={item.value} type="button" aria-pressed={category === item.value}
                  className={category === item.value ? styles.activeFilter : undefined}
                  onClick={() => setCategory(item.value)}>{item.label}</button>
              ))}
            </div>
            <div className={styles.search}>
              <Search size={17} aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
                aria-label="Search projects, technologies or roles" placeholder="Search work or technology" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
            </div>
          </div>
          <div className={styles.collectionMeta}>
            <p role="status" aria-live="polite">{loading ? "Updating projects…" : `${filtered.length} ${filtered.length === 1 ? "project" : "projects"}${search || category !== "all" ? " found" : " to explore"}`}</p>
            <span>DESIGN / DEVELOP / DELIVER</span>
          </div>

          {error && <div className={styles.notice} role="alert">
            <h2>We couldn’t load the latest projects.</h2>
            <p>Please try again in a moment.</p>
            <button type="button" disabled={loading} onClick={() => void dispatch(fetchProjectsList())}>{loading ? "Retrying…" : "Try again"}</button>
          </div>}
          {loading && projects.length === 0 ? (
            <div className={styles.grid} aria-label="Loading projects" aria-busy="true">
              {[0, 1, 2, 3].map((item) => <div key={item} className={styles.skeleton} aria-hidden="true"><div /><span /><span /></div>)}
            </div>
          ) : filtered.length > 0 ? (
            <div className={styles.grid}>
              {filtered.map((project, index) => <ProjectCard key={project.project_id ?? project.project_name} project={project} index={index} />)}
            </div>
          ) : !error && (
            <div className={styles.notice}>
              <h2>{projects.length ? "No matches this time." : "New work is on its way."}</h2>
              <p>{projects.length ? "Try a different keyword or explore the full collection." : "Check back soon for new projects."}</p>
              {projects.length > 0 && <button type="button" onClick={resetFilters}>Show all projects</button>}
            </div>
          )}
        </section>

        <section className={styles.cta}>
          <div><p className={styles.eyebrow}>HAVE SOMETHING IN MIND?</p><h2>Let’s build <em>what’s next.</em></h2></div>
          <button type="button" aria-haspopup="dialog" onClick={openContact}>Start a conversation <ArrowUpRight size={20} /></button>
        </section>
      </main>
      <footer className={styles.footer}><span>© {new Date().getFullYear()} Deepanshu Gulia</span><Link to="/"><ArrowLeft size={14} /> Back to portfolio</Link></footer>
    </div>
  );
}
