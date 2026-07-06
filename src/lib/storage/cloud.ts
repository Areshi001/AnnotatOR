import { supabase } from '@/lib/supabase';
import type {
  Annotation,
  LabelClass,
  Project,
  ProjectImage,
  PublicDataset,
  Workflow,
} from '@/types';
import type { NewProject, NewPublicDataset, StorageService, StorageStatus } from './types';
import { setStorageMode } from './config';

const now = () => new Date().toISOString();

const getBucket = () => supabase.storage.from('project-images');
const toPublicUrl = (pathOrUrl: string) => {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return getBucket().getPublicUrl(pathOrUrl).data.publicUrl;
};
const toStoragePath = (pathOrUrl: string) => {
  if (!(pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://'))) return pathOrUrl;
  const marker = '/storage/v1/object/public/project-images/';
  const index = pathOrUrl.indexOf(marker);
  return index >= 0 ? decodeURIComponent(pathOrUrl.slice(index + marker.length)) : pathOrUrl;
};

export const createCloudStorageService = (): StorageService => {
  const getStatus = async (): Promise<StorageStatus> => ({
    mode: 'cloud',
    localModeSupported: typeof window.showDirectoryPicker === 'function',
    localModeReady: true,
  });

  return {
    getStatus,
    setMode: async (mode) => setStorageMode(mode),
    ensureLocalModeRoot: async () => undefined,

    listProjects: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('updatedAt', { ascending: false });
      if (error) throw error;
      return (data || []) as Project[];
    },
    createProject: async (data: NewProject) => {
      const payload = {
        name: data.name,
        taskType: data.taskType,
        imageCount: data.imageCount ?? 0,
        splits: data.splits ?? { train: 70, val: 15, test: 15 },
      };
      const { data: created, error } = await supabase.from('projects').insert(payload).select().single();
      if (error) throw error;
      return created as Project;
    },
    getProject: async (id: string) => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Project;
    },
    deleteProject: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    updateProject: async (id: string, patch: Partial<Project>) => {
      const { data, error } = await supabase.from('projects').update({ ...patch, updatedAt: now() }).eq('id', id).select().single();
      if (error) throw error;
      return data as Project;
    },

    listImages: async (projectId: string) => {
      const { data, error } = await supabase.from('images').select('*').eq('projectId', projectId).order('uploadedAt', { ascending: false });
      if (error) throw error;
      return ((data || []) as ProjectImage[]).map((image) => ({ ...image, storageUrl: toPublicUrl(image.storageUrl) }));
    },
    uploadImage: async (projectId: string, file: File) => {
      const filename = `${Date.now()}-${file.name}`;
      const path = `${projectId}/${filename}`;
      const { data, error } = await getBucket().upload(path, file);
      if (error) throw error;
      const image: Omit<ProjectImage, 'id'> & { id?: string } = {
        projectId,
        storageUrl: data.path,
        fileName: file.name,
        split: 'train',
        annotated: false,
        uploadedAt: now(),
      };
      const { data: created, error: insertError } = await supabase.from('images').insert({ ...image, storageUrl: toPublicUrl(data.path) }).select().single();
      if (insertError) throw insertError;
      return created as ProjectImage;
    },
    deleteImage: async (imageId: string) => {
      const { data, error } = await supabase.from('images').select('*').eq('id', imageId).single();
      if (error) throw error;
      if (data?.storageUrl) {
        await getBucket().remove([toStoragePath(data.storageUrl)]);
      }
      const { error: deleteError } = await supabase.from('images').delete().eq('id', imageId);
      if (deleteError) throw deleteError;
    },
    getImageUrl: async (image: ProjectImage) => toPublicUrl(image.storageUrl),

    listClasses: async (projectId: string) => {
      const { data, error } = await supabase.from('label_classes').select('*').eq('projectId', projectId).order('createdAt', { ascending: true });
      if (error) throw error;
      return (data || []) as LabelClass[];
    },
    saveClass: async (projectId: string, cls) => {
      const payload = {
        projectId,
        name: cls.name,
        color: cls.color,
        createdAt: cls.createdAt ?? now(),
      };
      if (cls.id) {
        const { data, error } = await supabase.from('label_classes').update(payload).eq('id', cls.id).select().single();
        if (error) throw error;
        return data as LabelClass;
      }
      const { data, error } = await supabase.from('label_classes').insert(payload).select().single();
      if (error) throw error;
      return data as LabelClass;
    },
    deleteClass: async (classId: string) => {
      const { error } = await supabase.from('label_classes').delete().eq('id', classId);
      if (error) throw error;
    },

    listAnnotations: async (imageId: string) => {
      const { data, error } = await supabase.from('annotations').select('*').eq('imageId', imageId);
      if (error) throw error;
      return (data || []) as Annotation[];
    },
    saveAnnotations: async (imageId: string, anns: Annotation[]) => {
      const { error: deleteError } = await supabase.from('annotations').delete().eq('imageId', imageId);
      if (deleteError) throw deleteError;
      if (anns.length > 0) {
        const { error } = await supabase.from('annotations').insert(anns);
        if (error) throw error;
      }
      const { error: updateError } = await supabase.from('images').update({ annotated: anns.length > 0 }).eq('id', imageId);
      if (updateError) throw updateError;
    },

    getWorkflow: async (projectId: string) => {
      const { data, error } = await supabase.from('workflows').select('*').eq('projectId', projectId).order('updatedAt', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data as Workflow) || null;
    },
    saveWorkflow: async (projectId: string, wf: Workflow) => {
      const payload = { ...wf, projectId, updatedAt: now() };
      if (wf.id) {
        const { error } = await supabase.from('workflows').update(payload).eq('id', wf.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('workflows').insert(payload);
      if (error) throw error;
    },

    listPublicDatasets: async () => {
      const { data, error } = await supabase.from('public_datasets').select('*').eq('isPublic', true).order('createdAt', { ascending: false });
      if (error) throw error;
      return (data || []) as PublicDataset[];
    },
    publishDataset: async (data: NewPublicDataset) => {
      const payload = { ...data, isPublic: true, createdAt: now() };
      const { data: created, error } = await supabase.from('public_datasets').insert(payload).select().single();
      if (error) throw error;
      return created as PublicDataset;
    },
    likeDataset: async (datasetId: string, userId = 'anonymous-user') => {
      const { data, error } = await supabase.from('dataset_likes').select('*').eq('datasetId', datasetId).eq('userId', userId).maybeSingle();
      if (error) throw error;
      if (data) {
        const { error: deleteError } = await supabase.from('dataset_likes').delete().eq('datasetId', datasetId).eq('userId', userId);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase.from('dataset_likes').insert({ datasetId, userId });
        if (insertError) throw insertError;
      }
    },
    forkDataset: async (datasetId: string) => {
      const { data: dataset, error } = await supabase.from('public_datasets').select('*').eq('id', datasetId).single();
      if (error) throw error;
      const project = await supabase.from('projects').insert({
        name: `${dataset.name} (Fork)`,
        taskType: dataset.taskType,
        imageCount: dataset.imageCount,
        splits: { train: 70, val: 15, test: 15 },
      }).select().single();
      if (project.error) throw project.error;
      const { error: updateError } = await supabase.from('public_datasets').update({ forkCount: (dataset.forkCount || 0) + 1 }).eq('id', datasetId);
      if (updateError) throw updateError;
      return project.data as Project;
    },

    exportProjectJSON: async (projectId: string) => {
      const [project, images, classes, annotations, workflow] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('images').select('*').eq('projectId', projectId),
        supabase.from('label_classes').select('*').eq('projectId', projectId),
        supabase.from('annotations').select('*').eq('projectId', projectId),
        supabase.from('workflows').select('*').eq('projectId', projectId).maybeSingle(),
      ]);
      const payload = {
        project: project.data,
        images: images.data || [],
        classes: classes.data || [],
        annotations: annotations.data || [],
        workflow: workflow.data || null,
      };
      return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    },
    importProjectJSON: async (file: File) => {
      const payload = JSON.parse(await file.text()) as {
        project?: Project;
        images?: ProjectImage[];
        classes?: LabelClass[];
        annotations?: Annotation[];
        workflow?: Workflow | null;
      };

      if (payload.project) {
        await supabase.from('projects').insert(payload.project);
      }
      if (payload.images?.length) {
        await supabase.from('images').insert(payload.images);
      }
      if (payload.classes?.length) {
        await supabase.from('label_classes').insert(payload.classes);
      }
      if (payload.annotations?.length) {
        await supabase.from('annotations').insert(payload.annotations);
      }
      if (payload.workflow) {
        await supabase.from('workflows').insert(payload.workflow);
      }
    },
  };
};
