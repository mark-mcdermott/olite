import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, FileText, Folder, Trash2 } from 'lucide-react';
import type { FileNode } from '../../preload';

interface FileTreeNodeProps {
  node: FileNode;
  onFileClick?: (path: string) => void;
  onDelete?: (path: string, type: 'file' | 'folder') => void;
  level?: number;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, onFileClick, onDelete, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick?.(node.path);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(node.path, node.type);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  // Render indent guides (vertical lines) for each level
  const renderIndentGuides = () => {
    const guides = [];
    for (let i = 0; i < level; i++) {
      guides.push(
        <div
          key={i}
          className="flex-shrink-0 flex items-center"
          style={{ width: '16px', marginLeft: i === 0 ? '8px' : '0' }}
        >
          <div
            style={{
              width: '1px',
              height: '28px',
              backgroundColor: '#e0e0e0',
              marginLeft: '7px'
            }}
          />
        </div>
      );
    }
    return guides;
  };

  return (
    <div>
      <div
        className="flex items-center"
        style={{
          paddingLeft: level === 0 ? '8px' : '0',
          marginLeft: node.type === 'file' ? '16px' : '0'
        }}
      >
        {level > 0 && renderIndentGuides()}
        <div
          className="inline-flex items-center gap-1 hover:bg-[#e8e8e8] cursor-pointer group rounded-sm"
          style={{
            fontSize: '13.75px',
            color: '#5c5c5c',
            lineHeight: '2',
            paddingRight: '4px'
          }}
          onClick={handleClick}
        >
          {node.type === 'folder' && (
            <ChevronRight
              size={16}
              strokeWidth={2}
              className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              style={{ color: '#b6b6b6' }}
            />
          )}
          <span className="truncate">
            {node.name.replace('.md', '')}
          </span>
          {/* Delete button - shows on hover */}
          {!showDeleteConfirm && (
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#d8d8d8] rounded transition-opacity ml-1"
              style={{ color: '#999999' }}
              onClick={handleDeleteClick}
              title="Delete"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          )}
          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-1 ml-2">
              <button
                className="px-1.5 py-0.5 text-xs rounded bg-red-500 text-white hover:bg-red-600"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
              <button
                className="px-1.5 py-0.5 text-xs rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children
            .filter(child => !child.name.startsWith('.'))
            .map((child, index) => (
              <FileTreeNode
                key={`${child.path}-${index}`}
                node={child}
                onFileClick={onFileClick}
                onDelete={onDelete}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
};

interface InlineCreateInputProps {
  type: 'file' | 'folder';
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const InlineCreateInput: React.FC<InlineCreateInputProps> = ({ type, onSubmit, onCancel }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        let name = value.trim();
        if (type === 'file' && !name.endsWith('.md')) {
          name += '.md';
        }
        onSubmit(name);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      let name = value.trim();
      if (type === 'file' && !name.endsWith('.md')) {
        name += '.md';
      }
      onSubmit(name);
    } else {
      onCancel();
    }
  };

  return (
    <div
      className="flex items-center gap-2 pr-2"
      style={{
        fontSize: '13.75px',
        lineHeight: '2',
        paddingLeft: '8px',
        marginLeft: type === 'file' ? '16px' : '0'
      }}
    >
      {type === 'folder' ? (
        <Folder size={14} style={{ color: '#b6b6b6', flexShrink: 0 }} />
      ) : (
        <FileText size={14} style={{ color: '#b6b6b6', flexShrink: 0 }} />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={type === 'file' ? 'filename.md' : 'folder name'}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontSize: '13.75px',
          color: '#5c5c5c',
          border: '1px solid #737373',
          borderRadius: '2px',
          padding: '0 4px',
          margin: '2px 0'
        }}
      />
    </div>
  );
};

interface FileTreeComponentProps {
  tree: FileNode | null;
  onFileClick?: (path: string) => void;
  onDelete?: (path: string, type: 'file' | 'folder') => void;
  inlineCreateType?: 'file' | 'folder' | null;
  onInlineCreate?: (name: string, type: 'file' | 'folder') => void;
  onInlineCancel?: () => void;
}

export const FileTree: React.FC<FileTreeComponentProps> = ({
  tree,
  onFileClick,
  onDelete,
  inlineCreateType,
  onInlineCreate,
  onInlineCancel
}) => {
  if (!tree) {
    return (
      <div className="p-4 text-obsidian-text-muted text-sm">No vault loaded</div>
    );
  }

  const handleSubmit = (name: string) => {
    if (inlineCreateType && onInlineCreate) {
      onInlineCreate(name, inlineCreateType);
    }
  };

  const handleCancel = () => {
    onInlineCancel?.();
  };

  return (
    <div className="w-full h-full overflow-y-auto pt-1">
      {/* Skip root folder, render its children directly - no header like Obsidian */}
      {tree.children
        ?.filter(child => !child.name.startsWith('.'))
        .map((child, index) => (
          <FileTreeNode
            key={`${child.path}-${index}`}
            node={child}
            onFileClick={onFileClick}
            onDelete={onDelete}
            level={0}
          />
        ))}

      {/* Inline create input */}
      {inlineCreateType && (
        <InlineCreateInput
          type={inlineCreateType}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
