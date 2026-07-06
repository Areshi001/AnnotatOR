import { createCloudStorageService } from './cloud';
import { getStorageConfig, setStorageConfig, setStorageMode, isDirectoryPickerSupported } from './config';
import { createLocalStorageService } from './local';
import type { StorageMode, StorageService, StorageStatus } from './types';

const cloud = createCloudStorageService();
const local = createLocalStorageService();

export const getStorageService = (): StorageService =>
  getStorageConfig().storageMode === 'local' ? local : cloud;

export const storage = {
  getStatus: async (): Promise<StorageStatus> => getStorageService().getStatus(),
  setMode: async (mode: StorageMode) => {
    setStorageMode(mode);
    if (mode === 'local') {
      await local.ensureLocalModeRoot();
    }
  },
  setConfig: setStorageConfig,
  supportsLocalMode: isDirectoryPickerSupported,
  ensureLocalModeRoot: async () => local.ensureLocalModeRoot(),
  listProjects: async () => getStorageService().listProjects(),
  createProject: async (data: Parameters<StorageService['createProject']>[0]) => getStorageService().createProject(data),
  getProject: async (id: string) => getStorageService().getProject(id),
  deleteProject: async (id: string) => getStorageService().deleteProject(id),
  updateProject: async (id: string, patch: Parameters<StorageService['updateProject']>[1]) => getStorageService().updateProject(id, patch),
  listImages: async (projectId: string) => getStorageService().listImages(projectId),
  uploadImage: async (projectId: string, file: File) => getStorageService().uploadImage(projectId, file),
  deleteImage: async (imageId: string) => getStorageService().deleteImage(imageId),
  getImageUrl: async (image: Parameters<StorageService['getImageUrl']>[0]) => getStorageService().getImageUrl(image),
  listClasses: async (projectId: string) => getStorageService().listClasses(projectId),
  saveClass: async (projectId: string, cls: Parameters<StorageService['saveClass']>[1]) => getStorageService().saveClass(projectId, cls),
  deleteClass: async (classId: string) => getStorageService().deleteClass(classId),
  listAnnotations: async (imageId: string) => getStorageService().listAnnotations(imageId),
  saveAnnotations: async (imageId: string, anns: Parameters<StorageService['saveAnnotations']>[1]) => getStorageService().saveAnnotations(imageId, anns),
  getWorkflow: async (projectId: string) => getStorageService().getWorkflow(projectId),
  saveWorkflow: async (projectId: string, wf: Parameters<StorageService['saveWorkflow']>[1]) => getStorageService().saveWorkflow(projectId, wf),
  listPublicDatasets: async () => getStorageService().listPublicDatasets(),
  publishDataset: async (data: Parameters<StorageService['publishDataset']>[0]) => getStorageService().publishDataset(data),
  likeDataset: async (datasetId: string, userId?: string) => getStorageService().likeDataset(datasetId, userId),
  forkDataset: async (datasetId: string) => getStorageService().forkDataset(datasetId),
  exportProjectJSON: async (projectId: string) => getStorageService().exportProjectJSON(projectId),
  importProjectJSON: async (file: File) => getStorageService().importProjectJSON(file),
};
