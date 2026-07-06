export type Project = {
  id: string;
  name: string;
  taskType: 'detection' | 'classification' | 'segmentation';
  imageCount: number;
  createdAt: string;
  updatedAt: string;
  splits: {
    train: number;
    val: number;
    test: number;
  };
};

export type ProjectImage = {
  id: string;
  projectId: string;
  storageUrl: string;
  fileName: string;
  split: 'train' | 'val' | 'test';
  annotated: boolean;
  uploadedAt: string;
};

export type Annotation = {
  id: string;
  projectId: string;
  imageId: string;
  type: 'bbox' | 'polygon';
  classId: string;
  className: string;
  color: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  createdAt: string;
};

export type LabelClass = {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: string;
};

export type ProjectVersion = {
  id: string;
  projectId: string;
  version: number;
  description: string;
  imageCount: number;
  createdAt: string;
};

export type Workflow = {
  id: string;
  projectId: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
};

export type WorkflowNode = {
  id: string;
  type: 'loadDataset' | 'preprocess' | 'augment' | 'export';
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
};

export type PublicDataset = {
  id: string;
  name: string;
  description: string;
  taskType: 'detection' | 'classification' | 'segmentation';
  imageCount: number;
  classes: { name: string; color: string; count: number }[];
  tags: string[];
  previewImages: string[];
  likeCount: number;
  forkCount: number;
  authorId: string;
  authorName: string;
  isPublic: true;
  createdAt: string;
};
