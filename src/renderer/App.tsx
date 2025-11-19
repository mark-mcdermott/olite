import React, { useState, useEffect } from 'react';
import { useVault } from './hooks/useVault';
import { useTags } from './hooks/useTags';
import { FileTree } from './components/FileTree';
import { MarkdownEditor } from './components/MarkdownEditor';
import { TagBrowser } from './components/TagBrowser';
import { TagView } from './components/TagView';

type SidebarTab = 'files' | 'tags';
type ViewMode = 'editor' | 'tag-view';

const App: React.FC = () => {
  const { vaultPath, fileTree, loading, error, readFile, writeFile, getTodayNote } = useVault();
  const { tags, loading: tagsLoading, getTagContent } = useTags();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Load today's note on mount
  useEffect(() => {
    const loadTodayNote = async () => {
      try {
        const { path, content } = await getTodayNote();
        setSelectedFile(path);
        setFileContent(content);
      } catch (err) {
        console.error('Failed to load today note:', err);
      }
    };

    if (vaultPath) {
      loadTodayNote();
    }
  }, [vaultPath, getTodayNote]);

  const handleFileClick = async (path: string) => {
    try {
      const content = await readFile(path);
      setSelectedFile(path);
      setFileContent(content);
      setViewMode('editor');
      setSelectedTag(null);
    } catch (err: any) {
      console.error('Failed to read file:', err);
      alert(`Failed to read file: ${err.message}`);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setViewMode('tag-view');
    setSelectedFile(null);
  };

  const handleSave = async (content: string) => {
    if (!selectedFile) return;

    try {
      await writeFile(selectedFile, content);
      setFileContent(content);
    } catch (err: any) {
      console.error('Failed to save file:', err);
      throw err;
    }
  };

  if (loading && !fileTree) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-2xl mb-2">❌</div>
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <h1 className="text-lg font-semibold text-gray-800">Olite</h1>
        {vaultPath && <span className="ml-4 text-xs text-gray-500">{vaultPath}</span>}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSidebarTab('files')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                sidebarTab === 'files'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setSidebarTab('tags')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                sidebarTab === 'tags'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Tags
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'files' ? (
              <FileTree tree={fileTree} onFileClick={handleFileClick} />
            ) : (
              <TagBrowser
                tags={tags}
                selectedTag={selectedTag}
                onTagClick={handleTagClick}
              />
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'editor' && selectedFile ? (
            <>
              {/* File header */}
              <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
                <span className="text-sm font-medium text-gray-700">{selectedFile}</span>
              </div>

              {/* Markdown Editor */}
              <div className="flex-1 overflow-hidden">
                <MarkdownEditor
                  key={selectedFile}
                  initialContent={fileContent}
                  filePath={selectedFile}
                  onSave={handleSave}
                />
              </div>
            </>
          ) : viewMode === 'tag-view' && selectedTag ? (
            <TagView tag={selectedTag} getContent={getTagContent} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>Select a file to view its contents</p>
                <p className="text-sm mt-2">or</p>
                <p className="text-sm">Click the Tags tab to browse tags</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
