import React from 'react';

interface BreadcrumbProps {
  path: string;
  onNavigate?: (path: string) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, onNavigate }) => {
  // Split path into segments
  const segments = path.split('/').filter(Boolean);

  // Build cumulative paths for each segment
  const pathSegments = segments.map((segment, index) => {
    const fullPath = segments.slice(0, index + 1).join('/');
    return {
      name: segment.replace('.md', ''),
      path: fullPath,
      isLast: index === segments.length - 1
    };
  });

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
      {/* Home/Vault icon */}
      <button
        onClick={() => onNavigate?.('')}
        className="flex items-center hover:text-gray-900 transition-colors flex-shrink-0"
        title="Vault root"
      >
        <span className="text-lg">🏠</span>
      </button>

      {/* Path segments */}
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment.path}>
          <span className="text-gray-400 flex-shrink-0">/</span>
          {segment.isLast ? (
            <span className="font-medium text-gray-900 truncate">
              {segment.name}
            </span>
          ) : (
            <button
              onClick={() => onNavigate?.(segment.path)}
              className="hover:text-gray-900 hover:underline transition-colors truncate"
            >
              {segment.name}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
