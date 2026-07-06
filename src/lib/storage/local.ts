import type {
  Annotation,
  LabelClass,
  Project,
  ProjectImage,
  PublicDataset,
  Workflow,
} from '@/types';
import type { NewProject, NewPublicDataset, StorageService, StorageStatus } from './types';
import { getStorageConfig, isDirectoryPickerSupported, setStorageMode } from './config';

type LocalState = {
  projects: Project[];
  images: ProjectImage[];
  classes: LabelClass[];
  annotations: Annotation[];
  workflows: Workflow[];
  datasets: PublicDataset[];
  likes: { datasetId: string; userId: string }[];
};

const STORAGE_KEY = 'annotator.local.state';

const now = () => new Date().toISOString();
const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const defaultState = (): LocalState => ({
  projects: [],
  images: [],
  classes: [],
  annotations: [],
  workflows: [],
  datasets: [],
  likes: [],
});

const readState = (): LocalState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...(JSON.parse(raw) as Partial<LocalState>) } : defaultState();
  } catch {
    return defaultState();
  }
};

const writeState = (state: LocalState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const ensureProjectTimestamps = (project: Project): Project => ({
  ...project,
  createdAt: project.createdAt || now(),
  updatedAt: project.updatedAt || now(),
});

const blobToObjectUrl = async (blob: Blob) => URL.createObjectURL(blob);

export const createLocalStorageService = (): StorageService => {
  const getStatus = async (): Promise<StorageStatus> => ({
    mode: getStorageConfig().storageMode,
    localModeSupported: isDirectoryPickerSupported(),
    localModeReady: true,
  });

  const ensureLocalModeRoot = async () => {
    if (!isDirectoryPickerSupported()) return;
    if (typeof window.showDirectoryPicker !== 'function') return;
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const config = getStorageConfig();
      setStorageMode('local');
      localStorage.setItem('annotator.storage.rootName', handle.name || config.localRootName || 'AnnotatOR_Data');
    } catch {
      // Keep the app usable even if the picker is canceled.
    }
  };

  const listProjects = async () => readState().projects.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const createProject = async (data: NewProject) => {
    const state = readState();
    const project: Project = ensureProjectTimestamps({
      id: uuid(),
      name: data.name,
      taskType: data.taskType,
      imageCount: data.imageCount ?? 0,
      createdAt: now(),
      updatedAt: now(),
      splits: data.splits ?? { train: 70, val: 15, test: 15 },
    });
    state.projects.unshift(project);
    writeState(state);
    return project;
  };

  const getProject = async (id: string) => readState().projects.find((project) => project.id === id) || null;

  const deleteProject = async (id: string) => {
    const state = readState();
    state.projects = state.projects.filter((project) => project.id !== id);
    state.images = state.images.filter((image) => image.projectId !== id);
    state.classes = state.classes.filter((cls) => cls.projectId !== id);
    state.annotations = state.annotations.filter((ann) => ann.projectId !== id);
    state.workflows = state.workflows.filter((wf) => wf.projectId !== id);
    writeState(state);
  };

  const updateProject = async (id: string, patch: Partial<Project>) => {
    const state = readState();
    const index = state.projects.findIndex((project) => project.id === id);
    if (index < 0) throw new Error('Project not found');
    const next = { ...state.projects[index], ...patch, updatedAt: now() };
    state.projects[index] = next;
    writeState(state);
    return next;
  };

  const listImages = async (projectId: string) => readState().images.filter((image) => image.projectId === projectId);

  const uploadImage = async (projectId: string, file: File) => {
    const state = readState();
    const project = state.projects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found');

    const id = uuid();
    const image: ProjectImage = {
      id,
      projectId,
      storageUrl: await blobToObjectUrl(file),
      fileName: file.name,
      split: 'train',
      annotated: false,
      uploadedAt: now(),
    };
    state.images.unshift(image);
    project.imageCount += 1;
    project.updatedAt = now();
    writeState(state);
    return image;
  };

  const deleteImage = async (imageId: string) => {
    const state = readState();
    const image = state.images.find((item) => item.id === imageId);
    if (!image) return;
    state.images = state.images.filter((item) => item.id !== imageId);
    state.annotations = state.annotations.filter((ann) => ann.imageId !== imageId);
    const project = state.projects.find((item) => item.id === image.projectId);
    if (project) {
      project.imageCount = Math.max(0, project.imageCount - 1);
      project.updatedAt = now();
    }
    writeState(state);
  };

  const getImageUrl = async (image: ProjectImage) => image.storageUrl;

  const listClasses = async (projectId: string) => readState().classes.filter((cls) => cls.projectId === projectId);

  const saveClass = async (projectId: string, cls: Partial<LabelClass> & { name: string; color: string }) => {
    const state = readState();
    const existingIndex = cls.id ? state.classes.findIndex((item) => item.id === cls.id) : -1;
    const next: LabelClass = {
      id: cls.id ?? uuid(),
      projectId,
      name: cls.name,
      color: cls.color,
      createdAt: cls.createdAt ?? now(),
    };
    if (existingIndex >= 0) state.classes[existingIndex] = next;
    else state.classes.push(next);
    writeState(state);
    return next;
  };

  const deleteClass = async (classId: string) => {
    const state = readState();
    state.classes = state.classes.filter((item) => item.id !== classId);
    writeState(state);
  };

  const listAnnotations = async (imageId: string) => readState().annotations.filter((ann) => ann.imageId === imageId);

  const saveAnnotations = async (imageId: string, anns: Annotation[]) => {
    const state = readState();
    const image = state.images.find((item) => item.id === imageId);
    if (!image) throw new Error('Image not found');
    state.annotations = state.annotations.filter((ann) => ann.imageId !== imageId);
    state.annotations.push(...anns);
    image.annotated = true;
    writeState(state);
  };

  const getWorkflow = async (projectId: string) => readState().workflows.find((wf) => wf.projectId === projectId) || null;

  const saveWorkflow = async (projectId: string, wf: Workflow) => {
    const state = readState();
    const next = { ...wf, projectId, updatedAt: now() };
    const index = state.workflows.findIndex((item) => item.projectId === projectId);
    if (index >= 0) state.workflows[index] = next;
    else state.workflows.push(next);
    writeState(state);
  };

  const listPublicDatasets = async () => readState().datasets.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const publishDataset = async (data: NewPublicDataset) => {
    const state = readState();
    const dataset: PublicDataset = {
      ...data,
      id: uuid(),
      createdAt: now(),
      isPublic: true,
    };
    state.datasets.unshift(dataset);
    writeState(state);
    return dataset;
  };

  const likeDataset = async (datasetId: string, userId = 'anonymous-user') => {
    const state = readState();
    const dataset = state.datasets.find((item) => item.id === datasetId);
    if (!dataset) return;
    const existing = state.likes.findIndex((like) => like.datasetId === datasetId && like.userId === userId);
    if (existing >= 0) {
      state.likes.splice(existing, 1);
      dataset.likeCount = Math.max(0, dataset.likeCount - 1);
    } else {
      state.likes.push({ datasetId, userId });
      dataset.likeCount += 1;
    }
    writeState(state);
  };

  const forkDataset = async (datasetId: string) => {
    const state = readState();
    const dataset = state.datasets.find((item) => item.id === datasetId);
    if (!dataset) throw new Error('Dataset not found');
    dataset.forkCount += 1;
    const project = await createProject({
      name: `${dataset.name} (Fork)`,
      taskType: dataset.taskType,
      imageCount: dataset.imageCount,
      splits: { train: 70, val: 15, test: 15 },
    });
    writeState(state);
    return project;
  };

  const exportProjectJSON = async (projectId: string) => {
    const state = readState();
    const payload = {
      project: state.projects.find((project) => project.id === projectId) || null,
      images: state.images.filter((image) => image.projectId === projectId),
      classes: state.classes.filter((cls) => cls.projectId === projectId),
      annotations: state.annotations.filter((ann) => ann.projectId === projectId),
      workflow: state.workflows.find((wf) => wf.projectId === projectId) || null,
    };
    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  };

  const importProjectJSON = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text) as Partial<LocalState> & {
      project?: Project;
      images?: ProjectImage[];
      classes?: LabelClass[];
      annotations?: Annotation[];
      workflow?: Workflow | null;
    };
    const state = readState();
    if (payload.project) state.projects.push(payload.project);
    if (payload.images?.length) state.images.push(...payload.images);
    if (payload.classes?.length) state.classes.push(...payload.classes);
    if (payload.annotations?.length) state.annotations.push(...payload.annotations);
    if (payload.workflow) state.workflows.push(payload.workflow);
    writeState(state);
  };

  return {
    getStatus,
    setMode: async (mode) => setStorageMode(mode),
    ensureLocalModeRoot,
    listProjects,
    createProject,
    getProject,
    deleteProject,
    updateProject,
    listImages,
    uploadImage,
    deleteImage,
    getImageUrl,
    listClasses,
    saveClass,
    deleteClass,
    listAnnotations,
    saveAnnotations,
    getWorkflow,
    saveWorkflow,
    listPublicDatasets,
    publishDataset,
    likeDataset,
    forkDataset,
    exportProjectJSON,
    importProjectJSON,
  };
};
