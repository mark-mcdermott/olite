import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownEditorProps {
  initialContent: string;
  filePath: string;
  onSave: (content: string) => Promise<void>;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent,
  filePath,
  onSave
}) => {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update content when file changes
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, filePath]);

  // Auto-save functionality
  const saveContent = useCallback(async () => {
    if (content === initialContent) return; // No changes to save

    setIsSaving(true);
    try {
      await onSave(content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, initialContent, onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (content !== initialContent) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveContent();
      }, 2000); // Save 2 seconds after typing stops
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, initialContent, saveContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+S / Ctrl+S to save manually
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveContent();
    }

    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-obsidian-bg">
      {/* Toolbar */}
      <div className="h-9 border-b border-obsidian-border flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'edit'
                ? 'bg-accent/20 text-accent font-medium'
                : 'text-obsidian-text-secondary hover:text-obsidian-text hover:bg-obsidian-hover'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'split'
                ? 'bg-accent/20 text-accent font-medium'
                : 'text-obsidian-text-secondary hover:text-obsidian-text hover:bg-obsidian-hover'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'preview'
                ? 'bg-accent/20 text-accent font-medium'
                : 'text-obsidian-text-secondary hover:text-obsidian-text hover:bg-obsidian-hover'
            }`}
          >
            Preview
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {isSaving && (
            <span className="text-accent flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
              Saving...
            </span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-obsidian-text-muted">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'w-1/2 border-r border-obsidian-border' : 'w-full'
            } flex flex-col`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full font-mono text-sm resize-none focus:outline-none bg-obsidian-bg text-obsidian-text placeholder-obsidian-text-muted leading-relaxed"
              style={{ padding: '24px 24px 24px 32px' }}
              placeholder="Start writing..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            } overflow-auto bg-obsidian-bg`}
            style={{ padding: '24px 24px 24px 48px' }}
          >
            <div className="prose prose-sm max-w-none" style={{ overflow: 'hidden' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={{
                  h1: ({ children }) => <h1 style={{ marginLeft: 0, paddingLeft: 0 }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ marginLeft: 0, paddingLeft: 0 }}>{children}</h2>,
                  p: ({ children }) => <p style={{ marginLeft: 0, paddingLeft: 0 }}>{children}</p>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
