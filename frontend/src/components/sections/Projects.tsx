import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/StateManagement/Redux/reduxStore';
import { HomepageSectionHeading } from './HomepageSectionHeading';
import { FeaturedProjectCard } from './FeaturedProjectCard';
import { getSectionConfiguration } from '@/features/homepageSections/manifest';

export const Projects = () => {
  const { featuredProject } = useSelector((state: RootState) => state.projects);
  const { setting } = useSelector((state: RootState) => state.settings);
  const section = getSectionConfiguration(setting, 'project');
  const projects = (featuredProject || []).filter(project => project.project_id != null);

  if (!section?.enabled) return null;

  return (
    <section className="panel content-panel" id="projects">
      <HomepageSectionHeading section={section} />
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, index) => <FeaturedProjectCard key={project.project_id} project={project} index={index} />)}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-white/20 pt-7">
        <p className="m-0 text-sm leading-6 text-[#aaa7a2]">Explore more projects, experiments, and the stories behind them.</p>
        <Link to="/projects" className="inline-flex items-center gap-5 border border-[#ff6b24]/60 bg-[#080808]/90 px-6 py-4 font-['DM_Mono',monospace] text-[11px] text-[#ff6b24] !no-underline transition-colors hover:bg-[#ff6b24] hover:text-[#080808] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff6b24] motion-reduce:transition-none">View all projects <ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </section>
  );
};
