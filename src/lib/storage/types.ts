import type { Annotation, LabelClass, Project, ProjectImage, PublicDataset, Workflow } from '@/types';

export type StorageMode = 'cloud' | 'local';

export type StorageConfig = {
  storageMode: StorageMode;
  localRootName?: string;
};

export type NewProject = Pick<Project, 'name' | 'taskType'> & {
  imageCount?: number;
  splits?: Project['splits'];
};

export type NewLabelClass = Pick<LabelClass, 'name' | 'color'>;

export type NewPublicDataset = Omit<PublicDataset, 'id' | 'createdAt'>;

export type StorageStatus = {
  mode: StorageMode;
  localModeSupported: boolean;
  localModeReady: boolean;
};

export interface StorageService {
  getStatus(): Promise<StorageStatus>;
  setMode(mode: StorageMode): Promise<void>;
  ensureLocalModeRoot(): Promise<void>;

  listProjects(): Promise<Project[]>;
  createProject(data: NewProject): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  deleteProject(id: string): Promise<void>;
  updateProject(id: string, patch: Partial<Project>): Promise<Project>;

  listImages(projectId: string): Promise<ProjectImage[]>;
  uploadImage(projectId: string, file: File): Promise<ProjectImage>;
  deleteImage(imageId: string): Promise<void>;
  getImageUrl(image: ProjectImage): Promise<string>;

  listClasses(projectId: string): Promise<LabelClass[]>;
  saveClass(projectId: string, cls: Partial<LabelClass> & NewLabelClass): Promise<LabelClass>;
  deleteClass(classId: string): Promise<void>;

  listAnnotations(imageId: string): Promise<Annotation[]>;
  saveAnnotations(imageId: string, anns: Annotation[]): Promise<void>;

  getWorkflow(projectId: string): Promise<Workflow | null>;
  saveWorkflow(projectId: string, wf: Workflow): Promise<void>;

  listPublicDatasets(): Promise<PublicDataset[]>;
  publishDataset(data: NewPublicDataset): Promise<PublicDataset>;
  likeDataset(datasetId: string, userId?: string): Promise<void>;
  forkDataset(datasetId: string): Promise<Project>;

  exportProjectJSON(projectId: string): Promise<Blob>;
  importProjectJSON(file: File): Promise<void>;
}
