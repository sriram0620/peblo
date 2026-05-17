'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useNotesStore from '@/store/notesStore';
import { debounce, copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Check,
  Loader2,
  Share2,
  Brain,
  Sparkles,
  X,
  Lightbulb,
  CheckSquare,
  Tag,
  Globe,
  Pen,
  Eye,
  LinkIcon
} from 'lucide-react';
import styles from './editor.module.css';

// Markdown <-> HTML rich-text conversion helpers
export function domToMarkdown(node) {
  if (!node) return '';
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName.toLowerCase();
    let childrenMd = '';
    node.childNodes.forEach((child) => {
      childrenMd += domToMarkdown(child);
    });
    switch (tagName) {
      case 'h1':
        return `# ${childrenMd}\n\n`;
      case 'h2':
        return `## ${childrenMd}\n\n`;
      case 'h3':
        return `### ${childrenMd}\n\n`;
      case 'strong':
      case 'b':
        return `**${childrenMd}**`;
      case 'em':
      case 'i':
        return `*${childrenMd}*`;
      case 'del':
      case 's':
      case 'strike':
        return `~~${childrenMd}~~`;
      case 'code':
        return `\`${childrenMd}\``;
      case 'blockquote':
        return `> ${childrenMd}\n\n`;
      case 'a':
        const href = node.getAttribute('href') || '';
        return `[${childrenMd}](${href})`;
      case 'li':
        return `- ${childrenMd}\n`;
      case 'ul':
        return `${childrenMd}\n`;
      case 'ol': {
        let index = 1;
        let olMd = '';
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'li') {
            olMd += `${index}. ${domToMarkdown(child).replace(/^- /, '')}`;
            index++;
          } else {
            olMd += domToMarkdown(child);
          }
        });
        return `${olMd}\n`;
      }
      case 'br':
        return '\n';
      case 'div':
      case 'p':
        return `${childrenMd}\n`;
      default:
        return childrenMd;
    }
  }
  return '';
}

export function htmlToMarkdown(html) {
  if (typeof window === 'undefined') return html || '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  let md = domToMarkdown(tempDiv);
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

export function markdownToHtml(md) {
  if (!md) return '';
  let html = md;
  // Escape HTML entities to prevent raw HTML execution
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  // Blockquotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>');
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
  // Inline Code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Lists
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ol>$1</ol>');
  html = html.replace(/<\/ol>\s*<ol>/g, '');
  // Wrap plain lines in divs
  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '<br>';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<div')
    ) {
      return line;
    }
    return `<div>${line}</div>`;
  });
  return processedLines.join('');
}

export default function NoteEditorPage() {
  const router = useRouter();
  const { id } = useParams();
  const {
    currentNote,
    isSaving,
    fetchNote,
    updateNote,
    generateSummary,
    toggleShare,
    setCurrentNote,
  } = useNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [noteTags, setNoteTags] = useState([]);
  const [viewMode, setViewMode] = useState('edit');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const editorRef = useRef(null);

  // Fetch note on mount
  useEffect(() => {
    const loadNote = async () => {
      try {
        const note = await fetchNote(id);
        setTitle(note.title || '');
        setContent(note.content || '');
        setNoteTags(note.tags?.map((t) => t.name) || []);
        if (note.summary) {
          setAiResult({
            summary: note.summary,
            action_items: note.actionItems ? JSON.parse(note.actionItems) : [],
          });
        }
        setLoaded(true);
      } catch {
        toast.error('Note not found');
        router.push('/dashboard');
      }
    };
    loadNote();

    return () => setCurrentNote(null);
  }, [id, fetchNote, router, setCurrentNote]);

  // Set initial editor content once loaded
  useEffect(() => {
    if (loaded && editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = markdownToHtml(content);
    }
  }, [loaded]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce(async (noteId, updates) => {
      try {
        await updateNote(noteId, updates);
      } catch {
        // Silent fail for auto-save — the optimistic store handles rollback
      }
    }, 800),
    [updateNote]
  );

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (loaded) debouncedSave(id, { title: val });
  };

  // Tag management
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !noteTags.includes(tag)) {
        const newTags = [...noteTags, tag];
        setNoteTags(newTags);
        debouncedSave(id, { tags: newTags });
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && noteTags.length > 0) {
      const newTags = noteTags.slice(0, -1);
      setNoteTags(newTags);
      debouncedSave(id, { tags: newTags });
    }
  };

  const removeTag = (tagName) => {
    const newTags = noteTags.filter((t) => t !== tagName);
    setNoteTags(newTags);
    debouncedSave(id, { tags: newTags });
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const markdown = htmlToMarkdown(html);
    setContent(markdown);
    if (loaded) debouncedSave(id, { content: markdown });
  };

  const handleToolbarAction = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleEditorInput();
    }
  };

  const wrapSelectionWithTag = (tagName) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const element = document.createElement(tagName);
    try {
      range.surroundContents(element);
    } catch {
      element.appendChild(range.extractContents());
      range.insertNode(element);
    }
    handleEditorInput();
  };

  const handleLinkAction = () => {
    const url = prompt('Enter URL:');
    if (url) {
      handleToolbarAction('createLink', url);
    }
  };

  // AI Summary generation
  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setShowAIPanel(true);
    try {
      const result = await generateSummary(id);
      setAiResult(result);
      toast.success('AI summary generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  // Apply suggested title
  const applyTitle = (suggestedTitle) => {
    setTitle(suggestedTitle);
    debouncedSave(id, { title: suggestedTitle });
    toast.success('Title applied!');
  };

  // Share toggle
  const handleToggleShare = async () => {
    try {
      const result = await toggleShare(id);
      if (result.isPublic) {
        const shareUrl = `${window.location.origin}/shared/${result.shareId}`;
        await copyToClipboard(shareUrl);
        toast.success('Share link copied to clipboard!');
      } else {
        toast.success('Share link removed');
      }
    } catch {
      toast.error('Failed to toggle sharing');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        debouncedSave(id, { title, content, tags: noteTags });
        toast.success('Saved!');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, title, content, noteTags, debouncedSave]);

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      {/* Editor Toolbar */}
      <div className={styles.editorToolbar}>
        <div className={styles.editorToolbarLeft}>
          <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </span>
          </button>
          <div className={styles.saveStatus}>
            <span
              className={`${styles.saveStatusDot} ${isSaving ? styles.saveStatusSaving : styles.saveStatusSaved}`}
            />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {isSaving ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Check size={12} />
              )}
              {isSaving ? 'Saving...' : 'Saved'}
            </span>
          </div>
        </div>

        <div className={styles.editorToolbarRight}>
          <button
            className={`btn btn-sm ${currentNote?.isPublic ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={handleToggleShare}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {currentNote?.isPublic ? <Globe size={14} /> : <Share2 size={14} />}
            {currentNote?.isPublic ? 'Shared' : 'Share'}
          </button>
          <button
            className={`btn btn-sm ${showAIPanel ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => {
              if (!showAIPanel && !aiResult) {
                handleGenerateSummary();
              } else {
                setShowAIPanel(!showAIPanel);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Brain size={14} />
            AI
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerateSummary}
            disabled={aiLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {aiLoading ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Summarize
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className={styles.editorBody}>
        {/* Main Editor */}
        <div className={styles.editorMain}>
          <input
            type="text"
            className={styles.titleInput}
            placeholder="Untitled"
            value={title}
            onChange={handleTitleChange}
          />

          {/* Tags */}
          <div className={styles.tagsSection}>
            <span className={styles.tagLabel}>Tags</span>
            <div className={styles.tagInputWrapper}>
              {noteTags.map((tag) => (
                <span key={tag} className={styles.existingTag}>
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                className={styles.tagInput}
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {/* Markdown Toolbar */}
          <div className={styles.mdToolbar}>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('bold')} title="Bold">
              <strong>B</strong>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('italic')} title="Italic">
              <em>I</em>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('strikeThrough')} title="Strikethrough">
              <s>S</s>
            </button>
            <span className={styles.mdToolbarDivider} />
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('formatBlock', '<h1>')} title="Heading 1">
              <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>H1</span>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('formatBlock', '<h2>')} title="Heading 2">
              <span style={{ fontSize: '0.95em', fontWeight: 'bold' }}>H2</span>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('formatBlock', '<h3>')} title="Heading 3">
              <span style={{ fontSize: '0.8em', fontWeight: 'bold' }}>H3</span>
            </button>
            <span className={styles.mdToolbarDivider} />
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('insertUnorderedList')} title="Bullet list">
              <span style={{ fontWeight: 'bold', fontSize: '1.2em', lineHeight: 1 }}>•</span>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('insertOrderedList')} title="Numbered list">
              <span style={{ fontWeight: 'bold' }}>1.</span>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => wrapSelectionWithTag('code')} title="Inline code">
              <code style={{ fontSize: '0.8em', background: 'var(--bg-glass)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-primary)' }}>&lt;&gt;</code>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('formatBlock', '<pre>')} title="Code block">
              <code style={{ fontSize: '0.8em', background: 'var(--bg-glass)', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-primary)' }}>{'{ }'}</code>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => handleToolbarAction('formatBlock', '<blockquote>')} title="Quote">
              <span style={{ fontSize: '1.2em', fontFamily: 'serif', lineHeight: 1 }}>&ldquo;</span>
            </button>
            <button className={styles.mdToolbarBtn} onClick={handleLinkAction} title="Link">
              <LinkIcon size={14} />
            </button>
            <span className={styles.mdToolbarDivider} />
            <div className={styles.viewModeModeGroup} style={{ display: 'flex', background: 'var(--bg-glass)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
              <button
                className={`${styles.viewModeBtn} ${viewMode === 'edit' ? styles.viewModeBtnActive : ''}`}
                onClick={() => setViewMode('edit')}
                title="Edit Mode"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85em', background: viewMode === 'edit' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'edit' ? 'white' : 'inherit' }}
              >
                <Pen size={12} /> Edit
              </button>
              <button
                className={`${styles.viewModeBtn} ${viewMode === 'preview' ? styles.viewModeBtnActive : ''}`}
                onClick={() => setViewMode('preview')}
                title="Preview Mode"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85em', background: viewMode === 'preview' ? 'var(--color-primary)' : 'transparent', color: viewMode === 'preview' ? 'white' : 'inherit' }}
              >
                <Eye size={12} /> Preview
              </button>
            </div>
          </div>

          {/* Content */}
          <div className={styles.contentArea}>
            {viewMode === 'preview' ? (
              <div className={`markdown-content ${styles.previewContent}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*No content yet*'}
                </ReactMarkdown>
              </div>
            ) : (
              <div
                ref={editorRef}
                className={`${styles.contentTextarea} markdown-content`}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                placeholder="Start writing your note... (Visual editor - styled in real-time)"
              />
            )}
          </div>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className={styles.aiPanel}>
            <div className={styles.aiPanelHeader}>
              <h3 className={styles.aiPanelTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={18} style={{ color: 'var(--color-secondary)' }} /> AI Insights
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAIPanel(false)}>
                <X size={16} />
              </button>
            </div>

            {aiLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="skeleton" style={{ height: 100 }} />
                <div className="skeleton" style={{ height: 80 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : aiResult ? (
              <>
                {/* Summary */}
                {aiResult.summary && (
                  <div className={styles.aiSection}>
                    <h4 className={styles.aiSectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} style={{ color: 'var(--color-primary)' }} /> Summary
                    </h4>
                    <p className={styles.aiSummaryText}>{aiResult.summary}</p>
                  </div>
                )}

                {/* Action Items */}
                {aiResult.action_items?.length > 0 && (
                  <div className={styles.aiSection}>
                    <h4 className={styles.aiSectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckSquare size={14} style={{ color: 'var(--color-secondary)' }} /> Action Items
                    </h4>
                    {aiResult.action_items.map((item, idx) => (
                      <div key={idx} className={styles.aiActionItem}>
                        <span className={styles.aiActionBullet} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Title */}
                {aiResult.suggested_title && (
                  <div className={styles.aiSection}>
                    <h4 className={styles.aiSectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lightbulb size={14} style={{ color: '#fbbf24' }} /> Suggested Title
                    </h4>
                    <div className={styles.aiSuggestedTitle}>
                      <span className={styles.aiSuggestedTitleText}>{aiResult.suggested_title}</span>
                      <button
                        className={`btn btn-primary ${styles.aiApplyBtn}`}
                        onClick={() => applyTitle(aiResult.suggested_title)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                <p className="empty-state-text">
                  Click &quot;Summarize&quot; to generate AI insights for this note.
                </p>
              </div>
            )}

            {/* Share Link */}
            {currentNote?.isPublic && currentNote?.shareId && (
              <div className={styles.shareSection}>
                <h4 className={styles.aiSectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} style={{ color: 'var(--color-primary)' }} /> Share Link
                </h4>
                <div className={styles.shareLink}>
                  <input
                    className={styles.shareLinkInput}
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${currentNote.shareId}`}
                    readOnly
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      copyToClipboard(`${window.location.origin}/shared/${currentNote.shareId}`);
                      toast.success('Link copied!');
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
