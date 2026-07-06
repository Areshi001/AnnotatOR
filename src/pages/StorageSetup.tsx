import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, FolderOpen, Check, AlertTriangle } from 'lucide-react';
import { storage } from '@/lib/storage';

const StorageSetup = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'cloud' | 'local'>('cloud');
  const [supportsLocal, setSupportsLocal] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const status = await storage.getStatus();
      setMode(status.mode);
      setSupportsLocal(status.localModeSupported);
    })();
  }, []);

  const switchMode = async (nextMode: 'cloud' | 'local') => {
    setBusy(true);
    try {
      await storage.setMode(nextMode);
      setMode(nextMode);
      navigate('/');
    } catch (err) {
      console.error('Error switching storage mode:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Storage Mode</h1>
      <p className="text-gray-400 mb-8">
        Choose whether AnnotatOR should keep data in Supabase or store it locally on this device.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => void switchMode('cloud')}
          disabled={busy}
          className={`text-left p-6 rounded-lg border transition-colors ${
            mode === 'cloud' ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-blue-500'
          }`}
        >
          <Cloud className="w-8 h-8 text-blue-400 mb-3" />
          <h2 className="text-xl font-semibold text-white mb-2">Cloud storage</h2>
          <p className="text-sm text-gray-400">
            Uses Supabase for projects, images, annotations, and public datasets.
          </p>
          {mode === 'cloud' && <p className="text-xs text-green-400 mt-3 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Active</p>}
        </button>

        <button
          type="button"
          onClick={() => void switchMode('local')}
          disabled={busy || !supportsLocal}
          className={`text-left p-6 rounded-lg border transition-colors ${
            mode === 'local' ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-blue-500'
          } ${!supportsLocal ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <FolderOpen className="w-8 h-8 text-green-400 mb-3" />
          <h2 className="text-xl font-semibold text-white mb-2">Local storage</h2>
          <p className="text-sm text-gray-400">
            Keeps data on this device. Chromium browsers can also use a folder picker for device-side storage.
          </p>
          {!supportsLocal && (
            <p className="text-xs text-yellow-400 mt-3 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Folder picker unavailable in this browser
            </p>
          )}
          {mode === 'local' && <p className="text-xs text-green-400 mt-3 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Active</p>}
        </button>
      </div>
    </div>
  );
};

export default StorageSetup;
