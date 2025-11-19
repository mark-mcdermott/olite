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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-4 border-b border-gray-200">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Type to search files, tags, or commands..."
            className="w-full px-4 py-2 text-lg border-none outline-none"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-2xl">{cmd.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">{cmd.title}</div>
                    {cmd.description && (
                      <div className="text-sm text-gray-500">{cmd.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 uppercase">
                    {cmd.category}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};
