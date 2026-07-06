import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader, Upload } from 'lucide-react';
import { Project } from '@/types';
import { storage } from '@/lib/storage';

const TASK_TYPES = ['detection', 'classification', 'segmentation'] as const;

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState<{ name: string; taskType: Project['taskType'] }>({
    name: '',
    taskType: 'detection',
  });
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setProjects(await storage.listProjects());
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      const data = await storage.createProject({
        name: newProject.name,
        taskType: newProject.taskType,
        imageCount: 0,
        splits: { train: 70, val: 15, test: 15 },
      });
      setProjects([data, ...projects]);
      setNewProject({ name: '', taskType: 'detection' });
      setShowCreate(false);
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await storage.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setImporting(true);
    try {
      await storage.importProjectJSON(e.target.files[0]);
      setProjects(await storage.listProjects());
    } catch (err) {
      console.error('Error importing project bundle:', err);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Projects</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            {importing ? 'Importing...' : 'Import'}
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createProject} className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <input
            type="text"
            placeholder="Project name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
          <select
            value={newProject.taskType}
            onChange={(e) => {
              const nextTaskType = TASK_TYPES.includes(e.target.value as (typeof TASK_TYPES)[number])
                ? (e.target.value as (typeof TASK_TYPES)[number])
                : 'detection';
              setNewProject({ ...newProject, taskType: nextTaskType });
            }}
            className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="detection">Object Detection</option>
            <option value="classification">Classification</option>
            <option value="segmentation">Segmentation</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-4">No projects yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors group cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {project.name}
              </h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  <span className="font-medium">Type:</span>{' '}
                  <span className="capitalize">{project.taskType}</span>
                </p>
                <p>
                  <span className="font-medium">Images:</span> {project.imageCount}
                </p>
                <p>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteProject(project.id);
                }}
                className="mt-4 w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-sm transition-colors"
              >
                Delete
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
