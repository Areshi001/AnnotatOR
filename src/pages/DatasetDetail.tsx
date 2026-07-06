import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, GitFork, Image as ImageIcon, Tag, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PublicDataset } from '@/types';

const DatasetDetail = () => {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<PublicDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    if (datasetId) loadDataset();
  }, [datasetId]);

  const loadDataset = async () => {
    try {
      const { data, error } = await supabase
        .from('public_datasets')
        .select('*')
        .eq('id', datasetId)
        .single();

      if (error) throw error;
      setDataset(data);
    } catch (err) {
      console.error('Error loading dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!dataset) return;
    const userId = 'anonymous-user'; // In a real app, use auth user ID

    try {
      if (liked) {
        await supabase.from('dataset_likes').delete().eq('datasetId', dataset.id).eq('userId', userId);
        setDataset({ ...dataset, likeCount: dataset.likeCount - 1 });
        setLiked(false);
      } else {
        await supabase.from('dataset_likes').insert({ datasetId: dataset.id, userId });
        setDataset({ ...dataset, likeCount: dataset.likeCount + 1 });
        setLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const forkDataset = async () => {
    if (!dataset) return;
    setForking(true);
    try {
      // Create a new project from this dataset
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: `${dataset.name} (Fork)`,
          taskType: dataset.taskType,
          imageCount: dataset.imageCount,
          splits: { train: 70, val: 15, test: 15 },
        })
        .select()
        .single();

      if (error) throw error;

      // Increment fork count
      await supabase
        .from('public_datasets')
        .update({ forkCount: dataset.forkCount + 1 })
        .eq('id', dataset.id);

      // Navigate to the new project
      navigate(`/project/${project.id}`);
    } catch (err) {
      console.error('Error forking dataset:', err);
    } finally {
      setForking(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  if (!dataset) {
    return <div className="flex items-center justify-center h-full text-gray-400">Dataset not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/universe" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Universe
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{dataset.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {dataset.authorName || 'Anonymous'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(dataset.createdAt).toLocaleDateString()}
              </span>
              <span className={`px-2 py-0.5 rounded capitalize ${
                dataset.taskType === 'detection' ? 'bg-blue-900/50 text-blue-400' :
                dataset.taskType === 'classification' ? 'bg-green-900/50 text-green-400' :
                'bg-purple-900/50 text-purple-400'
              }`}>
                {dataset.taskType}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              liked
                ? 'bg-red-600/20 border-red-600 text-red-400'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-red-600 hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {dataset.likeCount} Like{dataset.likeCount !== 1 ? 's' : ''}
          </button>
          <button
            onClick={forkDataset}
            disabled={forking}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <GitFork className="w-4 h-4" />
            Fork ({dataset.forkCount})
          </button>
        </div>
      </div>

      {/* Description */}
      {dataset.description && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{dataset.description}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-400">{dataset.imageCount}</p>
          <p className="text-sm text-gray-400">Images</p>
        </div>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-400">{dataset.classes?.length || 0}</p>
          <p className="text-sm text-gray-400">Classes</p>
        </div>
        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-center">
          <p className="text-2xl font-bold text-purple-400">{dataset.likeCount + dataset.forkCount}</p>
          <p className="text-sm text-gray-400">Engagement</p>
        </div>
      </div>

      {/* Classes */}
      {dataset.classes && dataset.classes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Classes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {dataset.classes.map((cls, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: cls.color || '#4B5563' }} />
                  <span className="text-white text-sm">{cls.name}</span>
                </div>
                <span className="text-xs text-gray-500">{cls.count} images</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {dataset.tags && dataset.tags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {dataset.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preview images */}
      {dataset.previewImages && dataset.previewImages.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dataset.previewImages.map((url, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetDetail;
