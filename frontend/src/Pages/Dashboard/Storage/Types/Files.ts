export interface FileMetadata {
  eTag: string;
  size: number;
  mimetype: string;
  cacheControl: string;
  lastModified: string;
  contentLength: number;
  httpStatusCode: number;
}

export interface FileItem {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: FileMetadata;
}

export interface DropedFile {
  data: File;
  fileName: string;
  size: number;
  type: string;
}
