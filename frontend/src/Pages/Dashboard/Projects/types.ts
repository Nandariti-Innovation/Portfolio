export interface ImagefileType {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, string | number>;
}

export type ProjectDataType = {
  project_name: string;
  project_image: string;
  project_features: string[];
  project_github: string;
  project_link: string;
  project_description: string;
  project_tech_stack: string[];
};
