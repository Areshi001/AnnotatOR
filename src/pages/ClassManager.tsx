import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Palette } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LabelClass } from '@/types';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#64748B',
];

const ClassManager = () => {
  const { id } = useParams<{ id: string }>();
  const [classes, setClasses] = useState<LabelClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', color: PRESET_COLORS[0] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (id) loadClasses();
  }, [id]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('label_classes')
        .select('*')
        .eq('projectId', id)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim() || !id) return;

    try {
      const { data, error } = await supabase
        .from('label_classes')
        .insert({
          projectId: id,
          name: newClass.name.trim(),
          color: newClass.color,
        })
        .select()
        .single();

      if (error) throw error;
      setClasses([...classes, data]);
      setNewClass({ name: '', color: PRESET_COLORS[(classes.length) % PRESET_COLORS.length] });
      setShowCreate(false);
    } catch (err) {
      console.error('Error creating class:', err);
    }
  };

  const updateClass = async (classId: string) => {
    if (!editName.trim()) return;
    try {
      await supabase
        .from('label_classes')
        .update({ name: editName.trim() })
        .eq('id', classId);

      setClasses(classes.map(c => c.id === classId ? { ...c, name: editName.trim() } : c));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating class:', err);
    }
  };

  const deleteClass = async (classId: string) => {
    if (!window.confirm('Delete this class? Annotations using this class will lose their label.')) return;
    try {
      await supabase.from('label_classes').delete().eq('id', classId);
      setClasses(classes.filter(c => c.id !== classId));
    } catch (err) {
      console.error('Error deleting class:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-8">
      <Link to={`/project/${id}`} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Project
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Label Classes</h1>
          <p className="text-gray-400 mt-1">{classes.length} class{classes.length !== 1 ? 'es' : ''} defined</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Class
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createClass} className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">Class Name</label>
          <input
            type="text"
            placeholder="e.g., person, car, dog"
            value={newClass.name}
            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
            className="w-full px-4 py-2 mb-4 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-blue-500"
            autoFocus
          />

          <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewClass({ ...newClass, color })}
                className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                  newClass.color === color ? 'border-white scale-125' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-400">Preview:</span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: newClass.color }}
            >
              {newClass.name || 'class name'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Class
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

      {classes.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg border border-gray-700">
          <Palette className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No label classes yet</p>
          <p className="text-sm text-gray-500 mb-4">Define classes like "person", "car", "tree" to annotate images</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create your first class
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((cls, index) => (
            <div
              key={cls.id}
              className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <span className="text-gray-500 text-sm w-6 text-center">{index + 1}</span>
              <div
                className="w-5 h-5 rounded flex-shrink-0"
                style={{ backgroundColor: cls.color }}
              />

              {editingId === cls.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateClass(cls.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => updateClass(cls.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span
                    className="flex-1 font-medium cursor-pointer hover:text-blue-400 transition-colors"
                    style={{ color: cls.color }}
                    onClick={() => {
                      setEditingId(cls.id);
                      setEditName(cls.name);
                    }}
                  >
                    {cls.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(cls.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteClass(cls.id)}
                    className="p-2 hover:bg-red-600/20 rounded text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassManager;
