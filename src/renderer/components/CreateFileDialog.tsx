import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CreateFileDialogProps {
  isOpen: boolean;
  type: 'file' | 'folder';
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export const CreateFileDialog: React.FC<CreateFileDialogProps> = ({
  isOpen,
  type,
  onClose,
  onCreate
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // Validate name
    if (type === 'file' && !name.endsWith('.md')) {
      setError('File name must end with .md');
      return;
    }

    if (/[<>:"/\\|?*]/.test(name)) {
      setError('Name contains invalid characters');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await onCreate(name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-xl w-[400px]"
        style={{ backgroundColor: '#ffffff' }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>
            {type === 'file' ? 'New Note' : 'New Folder'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#e8e8e8] transition-colors"
            style={{ color: '#737373', backgroundColor: 'transparent' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block mb-1.5"
              style={{ fontSize: '13px', color: '#5c5c5c' }}
            >
              {type === 'file' ? 'Note name' : 'Folder name'}
            </label>
            <input
              ref={inputRef}
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={type === 'file' ? 'my-note.md' : 'my-folder'}
              className="w-full px-3 py-2 rounded"
              style={{
                fontSize: '13px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
                color: '#1a1a1a'
              }}
            />
            {error && (
              <p className="mt-1.5" style={{ fontSize: '12px', color: '#ef4444' }}>
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded transition-colors"
              style={{
                fontSize: '13px',
                color: '#5c5c5c',
                backgroundColor: 'transparent',
                border: '1px solid #e0e0e0'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-3 py-1.5 rounded transition-colors"
              style={{
                fontSize: '13px',
                color: '#ffffff',
                backgroundColor: isCreating ? '#9ca3af' : '#737373',
                border: 'none'
              }}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
