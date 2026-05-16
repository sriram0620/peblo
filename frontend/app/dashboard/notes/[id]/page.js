'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useNotesStore from '@/store/notesStore';
import { debounce, copyToClipboard } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './editor.module.css';

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
  const [showPreview, setShowPreview] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const textareaRef = useRef(null);

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

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    if (loaded) debouncedSave(id, { content: val });
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

  // Markdown toolbar actions
  const insertMarkdown = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) + prefix + selected + suffix + content.substring(end);

    setContent(newContent);
    debouncedSave(id, { content: newContent });

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
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
            ← Back
          </button>
          <div className={styles.saveStatus}>
            <span
              className={`${styles.saveStatusDot} ${isSaving ? styles.saveStatusSaving : styles.saveStatusSaved}`}
            />
            {isSaving ? 'Saving...' : 'Saved'}
          </div>
        </div>

        <div className={styles.editorToolbarRight}>
          <button
            className={`btn btn-sm ${currentNote?.isPublic ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={handleToggleShare}
          >
            {currentNote?.isPublic ? '🔗 Shared' : '🔗 Share'}
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
          >
            🤖 AI
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerateSummary}
            disabled={aiLoading}
          >
            {aiLoading ? <><span className="spinner" /> Analyzing...</> : '✨ Summarize'}
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
                  <button onClick={() => removeTag(tag)}>✕</button>
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
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('**', '**')} title="Bold">
              <strong>B</strong>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('*', '*')} title="Italic">
              <em>I</em>
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('~~', '~~')} title="Strikethrough">
              <s>S</s>
            </button>
            <span className={styles.mdToolbarDivider} />
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('# ')} title="Heading 1">
              H1
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('## ')} title="Heading 2">
              H2
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('### ')} title="Heading 3">
              H3
            </button>
            <span className={styles.mdToolbarDivider} />
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('- ')} title="Bullet list">
              •
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('1. ')} title="Numbered list">
              1.
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('`', '`')} title="Inline code">
              {'<>'}
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('```\n', '\n```')} title="Code block">
              {'{ }'}
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('> ')} title="Quote">
              "
            </button>
            <button className={styles.mdToolbarBtn} onClick={() => insertMarkdown('[', '](url)')} title="Link">
              🔗
            </button>
            <span className={styles.mdToolbarDivider} />
            <button
              className={`${styles.mdToolbarBtn} ${styles.previewToggle} ${showPreview ? styles.previewToggleActive : ''}`}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '✏️ Edit' : '👁️ Preview'}
            </button>
          </div>

          {/* Content */}
          <div className={styles.contentArea}>
            {showPreview ? (
              <div className={`markdown-content ${styles.previewContent}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || '*No content yet*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                className={styles.contentTextarea}
                placeholder="Start writing your note... (Markdown supported)"
                value={content}
                onChange={handleContentChange}
              />
            )}
          </div>
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className={styles.aiPanel}>
            <div className={styles.aiPanelHeader}>
              <h3 className={styles.aiPanelTitle}>🤖 AI Insights</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAIPanel(false)}>
                ✕
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
                    <h4 className={styles.aiSectionTitle}>Summary</h4>
                    <p className={styles.aiSummaryText}>{aiResult.summary}</p>
                  </div>
                )}

                {/* Action Items */}
                {aiResult.action_items?.length > 0 && (
                  <div className={styles.aiSection}>
                    <h4 className={styles.aiSectionTitle}>Action Items</h4>
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
                    <h4 className={styles.aiSectionTitle}>Suggested Title</h4>
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
                <h4 className={styles.aiSectionTitle}>Share Link</h4>
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
