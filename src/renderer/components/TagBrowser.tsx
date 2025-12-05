import React from 'react';

interface TagBrowserProps {
  tags: string[];
  selectedTag: string | null;
  onTagClick: (tag: string) => void;
}

export const TagBrowser: React.FC<TagBrowserProps> = ({ tags, selectedTag, onTagClick }) => {
  if (tags.length === 0) {
    return (
      <div className="p-4 text-obsidian-text-muted text-sm">
        No tags found. Start writing with tags like <span className="text-accent">#project-a</span> in your notes!
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="px-3 py-2">
        <h3 className="text-[10px] font-semibold text-obsidian-text-muted uppercase tracking-wider">Tags</h3>
      </div>
      <div className="px-2">
        {tags.map(tag => (
          <div
            key={tag}
            onClick={() => onTagClick(tag)}
            className={`px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 transition-colors ${
              selectedTag === tag
                ? 'bg-accent/20 text-accent'
                : 'hover:bg-obsidian-hover text-obsidian-text-secondary hover:text-obsidian-text'
            }`}
          >
            <span className="text-accent text-sm font-medium">#</span>
            <span className={`text-sm ${selectedTag === tag ? 'font-medium' : ''}`}>
              {tag.substring(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
