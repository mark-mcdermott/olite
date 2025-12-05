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
    <div className="flex items-center gap-1.5 text-sm overflow-x-auto">
      {/* Home/Vault icon */}
      <button
        onClick={() => onNavigate?.('')}
        className="flex items-center text-obsidian-text-muted hover:text-accent transition-colors flex-shrink-0"
        title="Vault root"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>

      {/* Path segments */}
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment.path}>
          <span className="text-obsidian-text-muted flex-shrink-0">/</span>
          {segment.isLast ? (
            <span className="font-medium text-obsidian-text truncate">
              {segment.name}
            </span>
          ) : (
            <button
              onClick={() => onNavigate?.(segment.path)}
              className="text-obsidian-text-secondary hover:text-accent transition-colors truncate"
            >
              {segment.name}
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
