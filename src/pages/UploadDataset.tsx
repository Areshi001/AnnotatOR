import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import { storage } from '@/lib/storage';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#64748B',
];

const TASK_TYPES = ['detection', 'classification', 'segmentation'] as const;

const UploadDataset = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [localMode, setLocalMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    taskType: 'detection' as 'detection' | 'classification' | 'segmentation',
    imageCount: 0,
    authorName: '',
  });
  const [classes, setClasses] = useState<{ name: string; color: string; count: number }[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const status = await storage.getStatus();
      setLocalMode(status.mode === 'local');
    })();
  }, []);

  const addClass = () => {
    if (!newClassName.trim()) return;
    setClasses([
      ...classes,
      { name: newClassName.trim(), color: PRESET_COLORS[classes.length % PRESET_COLORS.length], count: 0 },
    ]);
    setNewClassName('');
  };

  const removeClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 4 - previewUrls.length);
    for (const file of files) {
      const url = URL.createObjectURL(file);
      setPreviewUrls((prev) => [...prev, url]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      await storage.publishDataset({
        name: form.name,
        description: form.description,
        taskType: form.taskType,
        imageCount: form.imageCount,
        classes,
        tags,
        previewImages: previewUrls,
        likeCount: 0,
        forkCount: 0,
        authorId: 'anonymous-user',
        authorName: form.authorName || 'Anonymous',
        isPublic: true,
      });
      navigate('/universe');
    } catch (err) {
      console.error('Error publishing dataset:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link to="/universe" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Universe
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Publish Dataset</h1>
      <p className="text-gray-400 mb-2">Share your dataset with the community</p>
      {localMode && (
        <p className="text-sm text-yellow-400 mb-8">
          Local mode is active, so this dataset will stay on this device until you switch to cloud storage or export it.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Dataset Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., COCO Person Detection"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your dataset, what it contains, and how it can be used..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Task Type</label>
              <select
                value={form.taskType}
                onChange={(e) => {
                  const nextTaskType = TASK_TYPES.includes(e.target.value as (typeof TASK_TYPES)[number])
                    ? (e.target.value as (typeof TASK_TYPES)[number])
                    : 'detection';
                  setForm({ ...form, taskType: nextTaskType });
                }}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="detection">Object Detection</option>
                <option value="classification">Classification</option>
                <option value="segmentation">Segmentation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Image Count</label>
              <input
                type="number"
                min="0"
                value={form.imageCount}
                onChange={(e) => setForm({ ...form, imageCount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Author Name</label>
            <input
              type="text"
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              placeholder="Your name (optional)"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Label Classes</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addClass())}
              placeholder="Add class name..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={addClass}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {classes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {classes.map((cls, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: cls.color }}
                >
                  {cls.name}
                  <button type="button" onClick={() => removeClass(i)} className="hover:text-gray-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Tags</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                  #{tag}
                  <button type="button" onClick={() => removeTag(i)} className="hover:text-gray-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Preview Images (up to 4)</h3>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {previewUrls.map((url, i) => (
              <div key={i} className="aspect-square bg-gray-700 rounded overflow-hidden relative">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPreviewUrls(previewUrls.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 p-0.5 bg-red-600 rounded text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {previewUrls.length < 4 && (
              <label className="aspect-square bg-gray-700 border-2 border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-6 h-6 text-gray-500" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePreviewUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Publishing...' : 'Publish Dataset'}
          </button>
          <Link
            to="/universe"
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default UploadDataset;
