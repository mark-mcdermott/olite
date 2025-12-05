import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface TaggedContent {
  date: string;
  filePath: string;
  content: string;
}

interface TagViewProps {
  tag: string;
  getContent: (tag: string) => Promise<TaggedContent[]>;
  onDeleteTag?: (tag: string) => Promise<void>;
  onPublish?: (tag: string) => void;
}

export const TagView: React.FC<TagViewProps> = ({ tag, getContent, onDeleteTag, onPublish }) => {
  const [content, setContent] = useState<TaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getContent(tag);
        setContent(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [tag, getContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-obsidian-bg">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-obsidian-text-secondary">Loading {tag}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-obsidian-bg">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-obsidian-bg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-obsidian-surface flex items-center justify-center mx-auto mb-3">
            <span className="text-accent text-2xl font-bold">#</span>
          </div>
          <p className="text-obsidian-text-secondary">No content found for {tag}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-obsidian-bg">
      {/* Header */}
      <div className="sticky top-0 bg-obsidian-bg-secondary border-b border-obsidian-border px-6 py-4 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-obsidian-text flex items-center gap-2">
              <span className="text-accent">#</span>
              {tag.substring(1)}
            </h1>
            <p className="text-sm text-obsidian-text-muted mt-1">
              {content.length} {content.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="flex gap-2">
            {onDeleteTag && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
                title="Delete all content with this tag"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
            <button
              onClick={() => onPublish?.(tag)}
              className="px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-obsidian-bg-secondary rounded-xl p-6 max-w-md w-full mx-4 border border-obsidian-border">
            <h2 className="text-lg font-semibold text-obsidian-text mb-2">Delete Tag Content?</h2>
            <p className="text-obsidian-text-secondary mb-4">
              This will permanently delete all content tagged with <strong className="text-accent">{tag}</strong> from your notes.
              This action cannot be undone.
            </p>
            <p className="text-sm text-obsidian-text-muted mb-6">
              {content.length} {content.length === 1 ? 'section' : 'sections'} will be removed from your files.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-obsidian-text-secondary hover:bg-obsidian-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (onDeleteTag) {
                      await onDeleteTag(tag);
                      setShowDeleteConfirm(false);
                    }
                  } catch (err: any) {
                    alert(`Failed to delete tag: ${err.message}`);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete {content.length} {content.length === 1 ? 'Section' : 'Sections'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content sections */}
      <div className="p-6 space-y-6">
        {content.map((item, index) => (
          <div
            key={`${item.date}-${index}`}
            className="border-l-2 border-accent/50 pl-5 py-1"
          >
            {/* Meta info */}
            <div className="flex items-center gap-3 mb-3 text-sm">
              <span className="font-medium text-obsidian-text-secondary">{item.date}</span>
              <span className="text-obsidian-text-muted">•</span>
              <span className="text-xs text-obsidian-text-muted">{item.filePath}</span>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {item.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-6 py-4 text-xs text-obsidian-text-muted text-center border-t border-obsidian-border">
        Read-only view aggregating all content tagged with {tag}
      </div>
    </div>
  );
};
