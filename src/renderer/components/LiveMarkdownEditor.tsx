import React, { useEffect, useRef, useCallback } from 'react';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
  ViewPlugin,
  ViewUpdate,
  keymap
} from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

// Widget that renders markdown as HTML
class RenderedMarkdownWidget extends WidgetType {
  constructor(readonly html: string) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('span');
    wrapper.innerHTML = this.html;
    wrapper.className = 'cm-rendered-markdown';
    return wrapper;
  }

  eq(other: RenderedMarkdownWidget) {
    return other.html === this.html;
  }
}

// Simple markdown to HTML converter for inline elements
function renderMarkdownLine(text: string): { html: string; isBlock: boolean } {
  let html = text;
  let isBlock = false;

  // Headers
  const headerMatch = text.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    const content = renderInlineMarkdown(headerMatch[2]);
    const styles: Record<number, string> = {
      1: 'font-size: 1.75em; font-weight: 700; line-height: 1.2;',
      2: 'font-size: 1.5em; font-weight: 700; line-height: 1.25;',
      3: 'font-size: 1.25em; font-weight: 600; line-height: 1.3;',
      4: 'font-size: 1.1em; font-weight: 600; line-height: 1.4;',
      5: 'font-size: 1em; font-weight: 600; line-height: 1.4;',
      6: 'font-size: 0.9em; font-weight: 600; line-height: 1.4;'
    };
    html = `<span style="${styles[level]}">${content}</span>`;
    isBlock = true;
    return { html, isBlock };
  }

  // Horizontal rule
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(text.trim())) {
    html = '<hr style="margin: 8px 0; border: none; border-top: 1px solid #d1d5db;" />';
    isBlock = true;
    return { html, isBlock };
  }

  // Blockquote
  if (text.startsWith('> ')) {
    const content = renderInlineMarkdown(text.slice(2));
    html = `<span style="border-left: 4px solid #9ca3af; padding-left: 12px; font-style: italic; color: #6b7280;">${content}</span>`;
    isBlock = true;
    return { html, isBlock };
  }

  // Unordered list item
  const ulMatch = text.match(/^(\s*)[-*+]\s+(.*)$/);
  if (ulMatch) {
    const indent = ulMatch[1].length;
    const content = renderInlineMarkdown(ulMatch[2]);
    const marginLeft = indent * 8;
    html = `<span style="margin-left: ${marginLeft}px"><span style="margin-right: 8px;">•</span>${content}</span>`;
    isBlock = true;
    return { html, isBlock };
  }

  // Ordered list item
  const olMatch = text.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (olMatch) {
    const indent = olMatch[1].length;
    const num = olMatch[2];
    const content = renderInlineMarkdown(olMatch[3]);
    const marginLeft = indent * 8;
    html = `<span style="margin-left: ${marginLeft}px"><span style="margin-right: 8px;">${num}.</span>${content}</span>`;
    isBlock = true;
    return { html, isBlock };
  }

  // Task list item
  const taskMatch = text.match(/^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/);
  if (taskMatch) {
    const indent = taskMatch[1].length;
    const checked = taskMatch[2].toLowerCase() === 'x';
    const content = renderInlineMarkdown(taskMatch[3]);
    const marginLeft = indent * 8;
    const checkbox = checked
      ? '<span style="margin-right: 8px;">☑</span>'
      : '<span style="margin-right: 8px;">☐</span>';
    html = `<span style="margin-left: ${marginLeft}px">${checkbox}${content}</span>`;
    isBlock = true;
    return { html, isBlock };
  }

  // Code block fence (just show as-is, we handle multi-line elsewhere)
  if (text.startsWith('```')) {
    return { html: text, isBlock: false };
  }

  // Regular paragraph with inline formatting
  html = renderInlineMarkdown(text);
  return { html, isBlock: false };
}

// Render inline markdown elements
function renderInlineMarkdown(text: string): string {
  let html = text;

  // Escape HTML first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Images: ![alt](url)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width: 100%; height: auto; display: inline;" />'
  );

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color: #7c3aed; text-decoration: underline;">$1</a>'
  );

  // Bold: **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(?<![_\w])_([^_]+)_(?![_\w])/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del style="text-decoration: line-through;">$1</del>');

  // Inline code: `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background-color: #e5e7eb; padding: 0 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>'
  );

  // Tags: #tag-name - make them clickable
  html = html.replace(
    /(^|\s)(#[a-zA-Z0-9_-]+)/g,
    '$1<span class="cm-tag-link" data-tag="$2">$2</span>'
  );

  return html;
}

// Effect to update the active line
const setActiveLine = StateEffect.define<number>();

// State field to track the active line number
const activeLineField = StateField.define<number>({
  create() {
    return -1;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setActiveLine)) {
        return effect.value;
      }
    }
    // Update based on selection
    if (tr.selection) {
      const line = tr.state.doc.lineAt(tr.selection.main.head);
      return line.number;
    }
    return value;
  }
});

// Create decorations for rendered markdown
function createDecorations(view: EditorView): DecorationSet {
  const activeLine = view.state.field(activeLineField);
  const decorations: Array<{ from: number; to: number; decoration: Decoration }> = [];
  const doc = view.state.doc;

  let inCodeBlock = false;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const lineText = line.text;

    // Skip the active line - show raw markdown there
    if (i === activeLine) {
      // Check if this line starts/ends a code block
      if (lineText.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      continue;
    }

    // Track code block state
    if (lineText.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      // Show code fence as-is but styled
      if (lineText.length > 0) {
        const lang = lineText.slice(3);
        const label = lang ? `Code (${lang})` : 'Code';
        decorations.push({
          from: line.from,
          to: line.to,
          decoration: Decoration.replace({
            widget: new RenderedMarkdownWidget(
              `<span style="color: #9ca3af; font-size: 0.75em;">${label}</span>`
            )
          })
        });
      }
      continue;
    }

    // Inside code block - show with code styling
    if (inCodeBlock) {
      if (lineText.length > 0) {
        const escaped = lineText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        decorations.push({
          from: line.from,
          to: line.to,
          decoration: Decoration.replace({
            widget: new RenderedMarkdownWidget(
              `<code style="background-color: #f3f4f6; padding: 0 4px; font-family: monospace; font-size: 0.9em; display: block;">${escaped}</code>`
            )
          })
        });
      }
      continue;
    }

    // Empty lines - skip
    if (lineText.trim() === '') {
      continue;
    }

    // Render the line
    const { html } = renderMarkdownLine(lineText);
    if (html !== lineText) {
      decorations.push({
        from: line.from,
        to: line.to,
        decoration: Decoration.replace({
          widget: new RenderedMarkdownWidget(html)
        })
      });
    }
  }

  return Decoration.set(
    decorations.map(d => d.decoration.range(d.from, d.to)),
    true
  );
}

// ViewPlugin to manage the live preview
const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = createDecorations(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations
  }
);

// Editor theme
const editorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    height: '100%'
  },
  '.cm-content': {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
    padding: '40px 24px 24px 48px',
    lineHeight: '1.75'
  },
  '.cm-line': {
    padding: '2px 0'
  },
  '.cm-cursor': {
    borderLeftColor: '#737373',
    borderLeftWidth: '2px'
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(115, 115, 115, 0.3) !important'
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(115, 115, 115, 0.3) !important'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0, 0, 0, 0.03)'
  },
  '.cm-rendered-markdown': {
    display: 'inline'
  },
  '.cm-scroller': {
    overflow: 'auto'
  },
  '.cm-tag-link': {
    color: '#7c3aed',
    cursor: 'pointer',
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
    transition: 'text-decoration-color 0.15s'
  },
  '.cm-tag-link:hover': {
    textDecorationColor: '#7c3aed'
  }
});

interface LiveMarkdownEditorProps {
  initialContent: string;
  filePath: string;
  onSave: (content: string) => Promise<void>;
  onTagClick?: (tag: string, newTab: boolean) => void;
}

export const LiveMarkdownEditor: React.FC<LiveMarkdownEditorProps> = ({
  initialContent,
  filePath,
  onSave,
  onTagClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const contentRef = useRef(initialContent);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save
  const scheduleSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      if (viewRef.current) {
        const content = viewRef.current.state.doc.toString();
        if (content !== contentRef.current) {
          contentRef.current = content;
          onSave(content);
        }
      }
    }, 2000);
  }, [onSave]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          if (viewRef.current) {
            const content = viewRef.current.state.doc.toString();
            if (content !== contentRef.current) {
              contentRef.current = content;
              onSave(content);
            }
          }
          return true;
        }
      }
    ]);

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        scheduleSave();
      }
      // Update active line on selection change
      if (update.selectionSet) {
        const line = update.state.doc.lineAt(update.state.selection.main.head);
        update.view.dispatch({
          effects: setActiveLine.of(line.number)
        });
      }
    });

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        activeLineField,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        markdown(),
        livePreviewPlugin,
        editorTheme,
        updateListener,
        EditorView.lineWrapping
      ]
    });

    const view = new EditorView({
      state,
      parent: containerRef.current
    });

    viewRef.current = view;
    contentRef.current = initialContent;

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      view.destroy();
    };
  }, []);

  // Update content when file changes
  useEffect(() => {
    if (viewRef.current && initialContent !== contentRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== initialContent) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: initialContent
          }
        });
        contentRef.current = initialContent;
      }
    }
  }, [initialContent, filePath]);

  // Handle clicks on tags
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('cm-tag-link')) {
      e.preventDefault();
      e.stopPropagation();
      const tag = target.dataset.tag;
      if (tag && onTagClick) {
        // metaKey is Cmd on Mac, ctrlKey on Windows/Linux
        const newTab = e.metaKey || e.ctrlKey;
        onTagClick(tag, newTab);
      }
    }
  }, [onTagClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
      onClick={handleClick}
    />
  );
};
