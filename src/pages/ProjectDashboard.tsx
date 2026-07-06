import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Settings, Workflow } from 'lucide-react';
import { Project } from '@/types';
import { storage } from '@/lib/storage';

const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [splits, setSplits] = useState({ train: 70, val: 15, test: 15 });

  useEffect(() => {
    void (async () => {
      if (!id) return;
      try {
        const data = await storage.getProject(id);
        if (data) {
          setProject(data);
          setSplits(data.splits);
        }
      } catch (err) {
        console.error('Error loading project:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateSplits = async () => {
    if (!id || !project) return;
    try {
      const data = await storage.updateProject(id, { splits: { ...splits } });
      setProject(data);
    } catch (err) {
      console.error('Error updating splits:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  if (!project) {
    return <div className="flex items-center justify-center h-full text-gray-400">Project not found</div>;
  }

  return (
    <div className="p-8">
      <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
        <p className="text-gray-400">
          <span className="capitalize font-medium">{project.taskType}</span> • {project.imageCount} images
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          to={`/project/${id}/dataset`}
          className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer group"
        >
          <Upload className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-1">Upload Images</h3>
          <p className="text-sm text-gray-400">Add and manage dataset images</p>
        </Link>

        <Link
          to={`/project/${id}/classes`}
          className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer group"
        >
          <Settings className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-1">Label Classes</h3>
          <p className="text-sm text-gray-400">Define and manage label classes</p>
        </Link>

        <Link
          to={`/project/${id}/workflow`}
          className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors cursor-pointer group"
        >
          <Workflow className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-lg font-semibold text-white mb-1">Workflow</h3>
          <p className="text-sm text-gray-400">Build processing pipelines</p>
        </Link>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Dataset Splits</h2>
        <div className="space-y-4">
          {(['train', 'val', 'test'] as const).map((split) => (
            <div key={split}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300 capitalize">{split}</label>
                <span className="text-lg font-semibold text-blue-400">{splits[split]}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={splits[split]}
                onChange={(e) => {
                  const newVal = parseInt(e.target.value);
                  const total = Object.values(splits).reduce((a, b) => a + b) - splits[split] + newVal;
                  if (total <= 100) {
                    setSplits({ ...splits, [split]: newVal });
                  }
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-gray-700/50 rounded border border-gray-600">
          <p className="text-sm text-gray-300">
            Total: <span className="font-semibold">{splits.train + splits.val + splits.test}%</span>
          </p>
        </div>
        <button
          onClick={updateSplits}
          className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Save Splits
        </button>
      </div>
    </div>
  );
};

export default ProjectDashboard;
