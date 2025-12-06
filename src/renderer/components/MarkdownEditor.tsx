import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownEditorProps {
  initialContent: string;
  filePath: string;
  onSave: (content: string) => Promise<void>;
  viewMode: 'markdown' | 'editor' | 'preview' | 'split';
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialContent,
  filePath,
  onSave,
  viewMode
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // For live editor mode - show preview after delay
  const [showLivePreview, setShowLivePreview] = useState(true);
  const livePreviewTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    // In editor mode, hide preview while typing
    if (viewMode === 'editor') {
      setShowLivePreview(false);

      // Clear existing timer
      if (livePreviewTimerRef.current) {
        clearTimeout(livePreviewTimerRef.current);
      }

      // Show preview after 1.5 seconds of no typing
      livePreviewTimerRef.current = setTimeout(() => {
        setShowLivePreview(true);
      }, 1500);
    }
  };

  const handleEditorFocus = () => {
    if (viewMode === 'editor') {
      setShowLivePreview(false);
    }
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (livePreviewTimerRef.current) {
        clearTimeout(livePreviewTimerRef.current);
      }
    };
  }, []);

  // Click on preview in editor mode to edit
  const handlePreviewClick = () => {
    if (viewMode === 'editor') {
      setShowLivePreview(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const renderPreview = (padding: string) => (
    <div className="prose prose-sm max-w-none" style={{ overflow: 'hidden', padding }}>
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
  );

  return (
    <div className="flex flex-col h-full bg-obsidian-bg">
      {/* Editor and Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Markdown mode - raw text editor */}
        {viewMode === 'markdown' && (
          <div className="w-full flex flex-col">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full font-mono text-sm resize-none focus:outline-none bg-obsidian-bg text-obsidian-text placeholder-obsidian-text-muted leading-relaxed"
              style={{ padding: '40px 24px 24px 48px' }}
              placeholder="Start writing..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Editor mode - WYSIWYG-style with delayed rendering */}
        {viewMode === 'editor' && (
          <div className="w-full flex flex-col relative">
            {showLivePreview ? (
              <div
                className="flex-1 overflow-auto bg-obsidian-bg cursor-text"
                style={{ padding: '10px 24px 24px 45px' }}
                onClick={handlePreviewClick}
              >
                {renderPreview('0')}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                onFocus={handleEditorFocus}
                className="flex-1 w-full font-mono text-sm resize-none focus:outline-none bg-obsidian-bg text-obsidian-text placeholder-obsidian-text-muted leading-relaxed"
                style={{ padding: '40px 24px 24px 48px' }}
                placeholder="Start writing..."
                spellCheck={false}
                autoFocus
              />
            )}
          </div>
        )}

        {/* Split mode */}
        {viewMode === 'split' && (
          <>
            <div className="w-1/2 flex flex-col">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className="flex-1 w-full font-mono text-sm resize-none focus:outline-none bg-obsidian-bg text-obsidian-text placeholder-obsidian-text-muted leading-relaxed"
                style={{ padding: '24px' }}
                placeholder="Start writing..."
                spellCheck={false}
              />
            </div>
            <div className="w-1/2 overflow-auto bg-obsidian-bg" style={{ padding: '10px 24px 24px 90px' }}>
              {renderPreview('0')}
            </div>
          </>
        )}

        {/* Preview mode - read only */}
        {viewMode === 'preview' && (
          <div className="w-full overflow-auto bg-obsidian-bg" style={{ padding: '10px 24px 24px 45px' }}>
            {renderPreview('0')}
          </div>
        )}
      </div>
    </div>
  );
};
