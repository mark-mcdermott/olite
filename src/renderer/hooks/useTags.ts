import { useState, useEffect, useCallback } from 'react';

interface TaggedContent {
  date: string;
  filePath: string;
  content: string;
}

interface UseTagsReturn {
  tags: string[];
  loading: boolean;
  error: string | null;
  refreshTags: () => Promise<void>;
  getTagContent: (tag: string) => Promise<TaggedContent[]>;
  deleteTag: (tag: string) => Promise<{ filesModified: string[]; sectionsDeleted: number }>;
}

export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tags
  const refreshTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.tags.getAllTags();
      if (result.success) {
        setTags(result.tags);
      } else {
        setError(result.error || 'Failed to load tags');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get content for a specific tag
  const getTagContent = useCallback(async (tag: string): Promise<TaggedContent[]> => {
    const result = await window.electronAPI.tags.getContent(tag);
    if (!result.success) {
      throw new Error(result.error || 'Failed to get tag content');
    }
    return result.content;
  }, []);

  // Delete all content for a tag
  const deleteTag = useCallback(
    async (tag: string) => {
      const result = await window.electronAPI.tags.deleteContent(tag);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete tag content');
      }
      await refreshTags();
      return {
        filesModified: result.filesModified,
        sectionsDeleted: result.sectionsDeleted
      };
    },
    [refreshTags]
  );

  // Load tags on mount
  useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  return {
    tags,
    loading,
    error,
    refreshTags,
    getTagContent,
    deleteTag
  };
};
