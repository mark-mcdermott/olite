import React from 'react';

interface TagBrowserProps {
  tags: string[];
  selectedTag: string | null;
  onTagClick: (tag: string) => void;
}

export const TagBrowser: React.FC<TagBrowserProps> = ({ tags, selectedTag, onTagClick }) => {
  if (tags.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No tags found. Start writing with tags like #project-a in your notes!
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-600 uppercase">Tags</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {tags.map(tag => (
          <div
            key={tag}
            onClick={() => onTagClick(tag)}
            className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center gap-2 ${
              selectedTag === tag ? 'bg-blue-50 border-l-2 border-blue-500' : ''
            }`}
          >
            <span className="text-lg">#️⃣</span>
            <span
              className={`text-sm ${
                selectedTag === tag ? 'text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              {tag.substring(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
