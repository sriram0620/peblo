'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import useNotesStore from '@/store/notesStore';
import { formatDate, stripMarkdown, truncate, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Archive, FileText, Plus, Trash2, ArchiveRestore, Globe, X } from 'lucide-react';
import styles from './notes.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const {
    notes,
    tags,
    isLoading,
    searchQuery,
    selectedTags,
    showArchived,
    fetchNotes,
    fetchTags,
    createNote,
    deleteNote,
    toggleArchive,
    setSearchQuery,
    setSelectedTags,
    setShowArchived,
  } = useNotesStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    fetchNotes();
    fetchTags();
  }, [fetchNotes, fetchTags, searchQuery, selectedTags, showArchived]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
    }, 300),
    [setSearchQuery]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  };

  const handleNewNote = async () => {
    try {
      const note = await createNote({ title: 'Untitled', content: '' });
      router.push(`/dashboard/notes/${note.id}`);
    } catch {
      toast.error('Failed to create note');
    }
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    if (window.confirm('Delete this note permanently?')) {
      try {
        await deleteNote(noteId);
        toast.success('Note deleted');
      } catch {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleArchiveNote = async (e, noteId) => {
    e.stopPropagation();
    try {
      await toggleArchive(noteId);
      toast.success(showArchived ? 'Note restored' : 'Note archived');
    } catch {
      toast.error('Failed to archive note');
    }
  };

  const handleTagFilter = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  return (
    <div className={styles.notesPage}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <Search size={16} />
          </span>
          <input
            id="notes-search"
            type="text"
            className={styles.searchInput}
            placeholder="Search notes..."
            value={localSearch}
            onChange={handleSearchChange}
          />
          <span className={styles.searchKbd}>⌘K</span>
        </div>

        <div className={styles.filterGroup}>
          <button
            className={`btn btn-sm ${showArchived ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setShowArchived(!showArchived)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {showArchived ? <Archive size={14} /> : <FileText size={14} />}
            {showArchived ? 'Archived' : 'Active'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleNewNote}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            New Note
          </button>
        </div>
      </div>

      {/* Tags filter row */}
      {tags.length > 0 && (
        <div className={styles.tagsRow}>
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={`${styles.tagChip} ${selectedTags.includes(tag.name) ? styles.tagChipActive : ''}`}
              onClick={() => handleTagFilter(tag.name)}
            >
              {tag.name}
              <span style={{ marginLeft: 4, opacity: 0.6 }}>{tag.count}</span>
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              className={styles.tagChip}
              onClick={() => setSelectedTags([])}
              style={{ color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Notes grid */}
      {isLoading ? (
        <div className={styles.notesGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: 'var(--space-lg)' }}>
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {showArchived ? <Archive size={40} /> : <FileText size={40} />}
          </div>
          <h3 className="empty-state-title">
            {showArchived ? 'No archived notes' : searchQuery ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="empty-state-text">
            {showArchived
              ? 'Archive notes to keep your workspace clean'
              : searchQuery
                ? 'Try a different search term or filter'
                : 'Create your first note to get started'}
          </p>
          {!showArchived && !searchQuery && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-md)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={handleNewNote}
            >
              <Plus size={16} /> Create Note
            </button>
          )}
        </div>
      ) : (
        <div className={styles.notesGrid}>
          {notes.map((note, idx) => (
            <div
              key={note.id}
              className={`glass-card ${styles.noteCard}`}
              onClick={() => router.push(`/dashboard/notes/${note.id}`)}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className={styles.noteCardHeader}>
                <h3 className={styles.noteCardTitle}>
                  {note.title || 'Untitled'}
                </h3>
                <div className={styles.noteCardActions}>
                  <button
                    className={styles.noteCardAction}
                    onClick={(e) => handleArchiveNote(e, note.id)}
                    title={showArchived ? 'Restore' : 'Archive'}
                  >
                    {showArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                  <button
                    className={styles.noteCardAction}
                    onClick={(e) => handleDeleteNote(e, note.id)}
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p className={styles.noteCardPreview}>
                {truncate(stripMarkdown(note.content), 120) || 'Empty note'}
              </p>

              <div className={styles.noteCardFooter}>
                <div className={styles.noteCardTags}>
                  {note.tags?.slice(0, 3).map((tag) => (
                    <span key={tag.id} className={styles.noteCardTag}>
                      {tag.name}
                    </span>
                  ))}
                  {note.tags?.length > 3 && (
                    <span className={styles.noteCardTag}>+{note.tags.length - 3}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  {note.isPublic && (
                    <span className={styles.noteCardShared} title="Publicly Shared">
                      <Globe size={14} />
                    </span>
                  )}
                  <span className={styles.noteCardDate}>{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
