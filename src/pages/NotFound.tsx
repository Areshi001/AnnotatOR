import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">404</p>
        <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
