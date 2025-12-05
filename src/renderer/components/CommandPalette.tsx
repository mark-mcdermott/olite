import React, { useState, useEffect, useRef } from 'react';
import type { FileNode } from '../../preload';

interface Command {
  id: string;
  title: string;
  description?: string;
  category: 'file' | 'tag' | 'action' | 'daily';
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  fileTree: FileNode | null;
  tags: string[];
  onFileSelect: (path: string) => void;
  onTagSelect: (tag: string) => void;
  onDateSelect: (date: string) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  fileTree,
  tags,
  onFileSelect,
  onTagSelect,
  onDateSelect,
  onCreateFile,
  onCreateFolder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build list of all files
  const getAllFiles = (node: FileNode | null, files: Array<{ path: string; name: string }> = []): Array<{ path: string; name: string }> => {
    if (!node) return files;

    if (node.type === 'file' && node.extension === '.md') {
      files.push({ path: node.path, name: node.name });
    }

    if (node.children) {
      node.children.forEach(child => getAllFiles(child, files));
    }

    return files;
  };

  // Build commands list
  const buildCommands = (): Command[] => {
    const commands: Command[] = [];

    // Add action commands
    commands.push({
      id: 'new-file',
      title: 'Create New File',
      category: 'action',
      icon: '📄',
      action: () => {
        onClose();
        onCreateFile();
      }
    });

    commands.push({
      id: 'new-folder',
      title: 'Create New Folder',
      category: 'action',
      icon: '📁',
      action: () => {
        onClose();
        onCreateFolder();
      }
    });

    // Add today/yesterday/tomorrow
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    commands.push({
      id: 'today',
      title: 'Go to Today',
      description: today,
      category: 'daily',
      icon: '📅',
      action: () => {
        onClose();
        onDateSelect(today);
      }
    });

    commands.push({
      id: 'yesterday',
      title: 'Go to Yesterday',
      description: yesterday,
      category: 'daily',
      icon: '📅',
      action: () => {
        onClose();
        onDateSelect(yesterday);
      }
    });

    commands.push({
      id: 'tomorrow',
      title: 'Go to Tomorrow',
      description: tomorrow,
      category: 'daily',
      icon: '📅',
      action: () => {
        onClose();
        onDateSelect(tomorrow);
      }
    });

    // Add all markdown files
    const allFiles = getAllFiles(fileTree);
    allFiles.forEach(file => {
      commands.push({
        id: `file-${file.path}`,
        title: file.name.replace('.md', ''),
        description: file.path,
        category: 'file',
        icon: '📄',
        action: () => {
          onClose();
          onFileSelect(file.path);
        }
      });
    });

    // Add all tags
    tags.forEach(tag => {
      commands.push({
        id: `tag-${tag}`,
        title: tag,
        description: 'View tag',
        category: 'tag',
        icon: '#️⃣',
        action: () => {
          onClose();
          onTagSelect(tag);
        }
      });
    });

    return commands;
  };

  const commands = buildCommands();

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const query = searchQuery.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(query) ||
      cmd.description?.toLowerCase().includes(query)
    );
  });

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start justify-center pt-20 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-obsidian-bg-secondary rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-obsidian-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-4 border-b border-obsidian-border">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-obsidian-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files, tags, or commands..."
              className="w-full bg-transparent text-lg text-obsidian-text placeholder-obsidian-text-muted border-none outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-obsidian-text-muted">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div>
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent/20 text-accent'
                      : 'hover:bg-obsidian-hover text-obsidian-text'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === selectedIndex ? 'bg-accent/20' : 'bg-obsidian-surface'
                  }`}>
                    {cmd.category === 'file' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {cmd.category === 'tag' && (
                      <span className="text-accent font-bold">#</span>
                    )}
                    {cmd.category === 'daily' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {cmd.category === 'action' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{cmd.title}</div>
                    {cmd.description && (
                      <div className="text-xs text-obsidian-text-muted truncate">{cmd.description}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-obsidian-text-muted uppercase px-2 py-0.5 bg-obsidian-surface rounded">
                    {cmd.category}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-obsidian-bg-tertiary border-t border-obsidian-border flex items-center gap-4 text-xs text-obsidian-text-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-obsidian-surface rounded text-[10px]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-obsidian-surface rounded text-[10px]">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-obsidian-surface rounded text-[10px]">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};
