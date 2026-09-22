import type { HomepageSectionConfiguration } from "@/features/homepageSections/manifest";
import { SectionHeader } from "./SectionHeader";

type HomepageSectionHeadingProps = {
  section: Pick<HomepageSectionConfiguration, "heading">;
};

/** Renders the validated heading shared by every homepage section template. */
export const HomepageSectionHeading = ({
  section,
}: HomepageSectionHeadingProps) => {
  const { index, eyebrow, title } = section.heading;

  return <SectionHeader index={index} eyebrow={eyebrow} title={title} />;
};
