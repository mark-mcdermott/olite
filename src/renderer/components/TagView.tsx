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
}

export const TagView: React.FC<TagViewProps> = ({ tag, getContent }) => {
  const [content, setContent] = useState<TaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading {tag}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">#️⃣</div>
          <p>No content found for {tag}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <h1 className="text-2xl font-bold text-gray-800">{tag}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {content.length} {content.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      {/* Content sections */}
      <div className="p-6 space-y-8">
        {content.map((item, index) => (
          <div
            key={`${item.date}-${index}`}
            className="border-l-4 border-blue-500 pl-6 py-2"
          >
            {/* Meta info */}
            <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
              <span className="font-medium">{item.date}</span>
              <span>•</span>
              <span className="text-xs">{item.filePath}</span>
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
      <div className="px-6 py-4 text-xs text-gray-400 text-center border-t border-gray-200">
        This is a read-only view aggregating all content tagged with {tag}
      </div>
    </div>
  );
};
