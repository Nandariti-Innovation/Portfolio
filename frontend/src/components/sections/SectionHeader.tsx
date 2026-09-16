export const SectionHeader = ({ index, eyebrow, title }: { index: string; eyebrow: string; title: string }) => (
  <header className="section-header">
    <span>{index}</span>
    <p>{eyebrow}</p>
    <h2>{title}</h2>
  </header>
);
