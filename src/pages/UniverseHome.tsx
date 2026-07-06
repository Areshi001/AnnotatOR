import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, GitFork, Image as ImageIcon, Search } from 'lucide-react';
import { PublicDataset } from '@/types';
import { storage } from '@/lib/storage';

const TASK_TYPES = ['all', 'detection', 'classification', 'segmentation'] as const;

const UniverseHome = () => {
  const [datasets, setDatasets] = useState<PublicDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [localMode, setLocalMode] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const status = await storage.getStatus();
        setLocalMode(status.mode === 'local');
        setDatasets(await storage.listPublicDatasets());
      } catch (err) {
        console.error('Error loading datasets:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = datasets.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(search.toLowerCase()) ||
      ds.description?.toLowerCase().includes(search.toLowerCase()) ||
      ds.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = taskFilter === 'all' || ds.taskType === taskFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dataset Universe</h1>
          <p className="text-gray-400 mt-1">Browse and discover public datasets for computer vision</p>
          {localMode && (
            <p className="text-sm text-yellow-400 mt-2">
              Local mode is active, so Universe browsing is read-only until you switch to cloud storage.
            </p>
          )}
        </div>
        <Link
          to="/universe/upload"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Upload Dataset
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search datasets by name, description, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {TASK_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTaskFilter(type)}
              className={`px-4 py-2 text-sm capitalize transition-colors ${
                taskFilter === type ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">
            {datasets.length === 0 ? 'No public datasets yet' : 'No datasets match your search'}
          </p>
          {datasets.length === 0 && (
            <Link
              to="/universe/upload"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Upload the first dataset
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ds) => (
            <Link
              key={ds.id}
              to={`/universe/${ds.id}`}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-colors group cursor-pointer"
            >
              <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                {ds.previewImages && ds.previewImages.length > 0 ? (
                  <div className="grid grid-cols-2 w-full h-full">
                    {ds.previewImages.slice(0, 4).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-700" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors truncate">
                    {ds.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded capitalize flex-shrink-0 ml-2 ${
                      ds.taskType === 'detection'
                        ? 'bg-blue-900/50 text-blue-400'
                        : ds.taskType === 'classification'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-purple-900/50 text-purple-400'
                    }`}
                  >
                    {ds.taskType}
                  </span>
                </div>

                {ds.description && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{ds.description}</p>}

                {ds.classes && ds.classes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ds.classes.slice(0, 5).map((cls, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: cls.color || '#4B5563' }}
                      >
                        {cls.name}
                      </span>
                    ))}
                    {ds.classes.length > 5 && <span className="text-xs text-gray-500">+{ds.classes.length - 5}</span>}
                  </div>
                )}

                {ds.tags && ds.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {ds.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {ds.imageCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {ds.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {ds.forkCount}
                  </span>
                  <span className="ml-auto text-xs">by {ds.authorName || 'Anonymous'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UniverseHome;
