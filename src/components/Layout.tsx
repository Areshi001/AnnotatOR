import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Image as ImageIcon, Globe, Database, RefreshCw } from 'lucide-react';
import { storage } from '@/lib/storage';

const Layout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'cloud' | 'local'>('cloud');

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    void (async () => {
      const status = await storage.getStatus();
      setMode(status.mode);
    })();
  }, []);

  const navItems = [
    { label: 'Projects', icon: LayoutGrid, path: '/' },
    { label: 'Universe', icon: Globe, path: '/universe' },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            <h1 className="text-lg font-bold text-white">CV Platform</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              {mode === 'local' ? 'Local storage' : 'Cloud storage'}
            </span>
            <button
              onClick={() => navigate('/setup')}
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Switch
            </button>
          </div>
          <p className="text-xs text-gray-400">v0.1.0</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-900">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
