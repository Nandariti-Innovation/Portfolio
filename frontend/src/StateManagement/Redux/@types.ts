export type FileItem = {
  name: string;
  id?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
  metadata: Record<string, number>;
};

export type SkillsItem = {
  skill_id: number;
  skill_name: string;
  skill_image: string;
  skill_level: "beginner" | "intermediate" | "expert";
};

export type ProjectItem = {
  project_id?: number;
  case_study_template_key?: string | null;
  project_name: string;
  project_image: string;
  project_features: string[];
  project_description: string;
  project_problem_faced: string;
  project_tech_stack: string[];
  project_type: "personal" | "professional" | "other";
  project_company_name: string;
  project_priority: string | null;
  project_start_date: string;
  project_end_date: string | null;
  project_status: "ongoing" | "completed" | "paused";
  project_role: string;
  project_team_size: number;
  project_platform: string;
  project_learning: string;
  project_github: string;
  project_link: string;
  project_company_website: string;
};

export type NavbarItem = {
  navbar_id: number;
  navbar_is_button: boolean;
  navbar_title?: string;
  navbar_link?: string;
  navbar_icon?: string;
};

export type HeroSectionType = {
  hero_description: string;
  hero_designation: string[];
  hero_image: string;
  hero_name: string;
  hero_short_description: string;
  hero_id: number;
  hero_first_name: string;
  hero_last_name: string;
  hero_other_words: string[];
  hero_greeting: string;
  hero_misc: Record<
    string,
    string | number | Record<string, string | number> | HeadingType
  >;
};

export type SocialItem = {
  social_id: number;
  social_title: string;
  social_link: string;
  social_svg: string;
};

export type FooterSectionType = {
  footer_description: string;
  footer_qr_svg: string;
  footer_email: string;
  footer_address: string;
  footer_heading: HeadingEmphasisType;
};

export type ExperienceType = {
  work_id?: number;
  work_company_name: string;
  work_start_date: string;
  work_end_date: string | null;
  work_location: string;
  work_designation: string;
  work_roles_responsibility: string[];
  work_tech_stack: string[];
  work_type: "full-time" | "part-time" | "freelance";
  work_short_description: string;
};

export type SettingsType<TSettingObject = unknown> = {
  setting_id: number;
  setting_name: string;
  setting_object: TSettingObject;
  schema_version: number;
  created_at: string;
  updated_at: string;
};

export type HeadingEmphasisType = {
  index: string;
  eyebrow: string;
  title_line: string;
  title_emphasis: string;
};

export type HeadingType = {
  index: string;
  eyebrow: string;
  title: string;
};
