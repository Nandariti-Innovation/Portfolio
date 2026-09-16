import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import type { ProjectItem } from '@/StateManagement/Redux/@types';
import supabase from '@/Superbase/client';
import { projectStyles as styles } from '../ProjectPage/projectStyles';
import { CaseStudyContent } from './CaseStudyContent';
import { useContactModal } from '@/hooks/useContactModal';

type Result = { id: string; project: ProjectItem | null; failed: boolean };

export default function ProjectCaseStudy() {
  const { projectID = '' } = useParams();
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { openContact } = useContactModal();
  const validID = /^\d+$/.test(projectID) && Number.isSafeInteger(Number(projectID));
  const current = result?.id === projectID ? result : null;

  useEffect(() => {
    if (!validID) return;
    let cancelled = false;
    setResult(null);
    async function fetchProject() {
      try {
        const { data, error } = await supabase.from('projects').select('*')
          .eq('project_id', Number(projectID)).maybeSingle();
        if (!cancelled) setResult({ id: projectID, project: error ? null : data, failed: Boolean(error) });
      } catch {
        if (!cancelled) setResult({ id: projectID, project: null, failed: true });
      }
    }
    void fetchProject();
    return () => { cancelled = true; };
  }, [projectID, validID, attempt]);

  useEffect(() => {
    document.title = current?.project ? `${current.project.project_name} — Case Study` : 'Case Study — Deepanshu Gulia';
  }, [current]);

  useEffect(() => { window.scrollTo(0, 0); }, [projectID]);

  const loading = validID && !current;
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand} aria-label="Deepanshu Gulia home">DG<span>.</span></Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link to="/">Home</Link><Link to="/projects">Projects</Link>
          <button type="button" aria-haspopup="dialog" onClick={openContact} className={styles.contactLink}>Let’s talk <ArrowUpRight size={14} /></button>
        </nav>
      </header>
      <main className={styles.main}>
        <Link to="/projects" className="inline-flex items-center gap-2 py-7 text-xs text-[#aaa7a2] hover:text-[#ff6b24]"><ArrowLeft size={14} /> All projects</Link>
        {current?.project ? <CaseStudyContent key={projectID} project={current.project} /> : (
          <div className="flex min-h-[65vh] flex-col items-center justify-center gap-5 text-center" aria-live="polite" aria-busy={loading}>
            {loading ? <><Loader2 className="animate-spin text-[#ff6b24] motion-reduce:animate-none" size={30} /><p>Loading the case study…</p></> : <>
              <p className={styles.eyebrow}>PROJECT CASE STUDY</p>
              <h1 className="font-['Playfair_Display',Georgia,serif] text-4xl sm:text-6xl">{current?.failed ? 'Couldn’t load this story.' : 'Project not found.'}</h1>
              <p className="max-w-md text-sm leading-7 text-[#aaa7a2]">{current?.failed ? 'Please try again to load the project details.' : 'This project may have moved or is no longer available. Explore the collection to find another.'}</p>
              {current?.failed && <button onClick={() => { setResult(null); setAttempt(value => value + 1); }} className="cursor-pointer border border-[#ff6b24]/50 px-6 py-3 text-sm text-[#ff6b24] hover:bg-[#ff6b24]/10">Try again</button>}
              <Link to="/projects" className="border-b border-[#ff6b24] py-2 text-sm">Explore projects <span aria-hidden="true">↗</span></Link>
            </>}
          </div>
        )}
        <section className="my-16 flex flex-wrap items-center justify-between gap-8 border-t border-white/10 pt-12 sm:my-24">
          <h2 className="font-['Playfair_Display',Georgia,serif] text-4xl tracking-tight sm:text-5xl">Have something <em className="text-[#ff6b24]">in mind?</em></h2>
          <button type="button" aria-haspopup="dialog" onClick={openContact} className="inline-flex cursor-pointer items-center gap-4 border-x-0 border-t-0 border-b border-[#ff6b24] bg-transparent py-3 text-sm text-inherit">Let’s build it together <ArrowUpRight size={20} /></button>
        </section>
      </main>
      <footer className="mx-auto flex w-[90%] max-w-[1280px] flex-wrap justify-between gap-4 border-t border-white/10 py-7 font-['DM_Mono',monospace] text-[10px] text-[#aaa7a2]">
        <span>© {new Date().getFullYear()} Deepanshu Gulia</span><Link to="/projects" className="hover:text-[#ff6b24]">Back to all projects ↗</Link>
      </footer>
    </div>
  );
}
