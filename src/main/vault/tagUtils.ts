/**
 * Tag extraction and parsing utilities
 */

export interface TaggedSection {
  tag: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface ParsedNote {
  filePath: string;
  date?: string;
  sections: TaggedSection[];
}

const TAG_REGEX = /^#[a-zA-Z0-9-]+$/;
const SEPARATOR = /^-{3,}$/;

/**
 * Extract all tags from content
 */
export function extractTags(content: string): string[] {
  const tags = new Set<string>();
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (TAG_REGEX.test(trimmed)) {
      tags.add(trimmed);
    }
  }

  return Array.from(tags);
}

/**
 * Parse content into tagged sections
 * Format:
 *   #tag-name
 *   Content here...
 *   ---
 *   #another-tag
 *   More content...
 *   ---
 */
export function parseTaggedSections(content: string, filePath: string): ParsedNote {
  const lines = content.split('\n');
  const sections: TaggedSection[] = [];
  let currentTag: string | null = null;
  let currentContent: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check if this is a tag line
    if (TAG_REGEX.test(trimmed)) {
      // Save previous section if exists
      if (currentTag && currentContent.length > 0) {
        sections.push({
          tag: currentTag,
          content: currentContent.join('\n').trim(),
          startLine,
          endLine: i - 1
        });
      }

      // Start new section
      currentTag = trimmed;
      currentContent = [];
      startLine = i + 1;
      continue;
    }

    // Check if this is a separator
    if (SEPARATOR.test(trimmed)) {
      // Save current section if exists
      if (currentTag && currentContent.length > 0) {
        sections.push({
          tag: currentTag,
          content: currentContent.join('\n').trim(),
          startLine,
          endLine: i - 1
        });
      }

      // Reset for next section
      currentTag = null;
      currentContent = [];
      continue;
    }

    // Add line to current section if we have an active tag
    if (currentTag !== null) {
      currentContent.push(lines[i]);
    }
  }

  // Save final section if exists
  if (currentTag && currentContent.length > 0) {
    sections.push({
      tag: currentTag,
      content: currentContent.join('\n').trim(),
      startLine,
      endLine: lines.length - 1
    });
  }

  // Extract date from filename if it's a daily note (YYYY-MM-DD.md)
  const dateMatch = filePath.match(/(\d{4}-\d{2}-\d{2})\.md$/);
  const date = dateMatch ? dateMatch[1] : undefined;

  return {
    filePath,
    date,
    sections
  };
}

/**
 * Check if a line is a tag
 */
export function isTag(line: string): boolean {
  return TAG_REGEX.test(line.trim());
}

/**
 * Check if a line is a separator
 */
export function isSeparator(line: string): boolean {
  return SEPARATOR.test(line.trim());
}

/**
 * Validate tag format
 */
export function isValidTag(tag: string): boolean {
  return TAG_REGEX.test(tag);
}
