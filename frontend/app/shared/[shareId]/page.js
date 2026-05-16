'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sharedAPI } from '@/lib/api';
import { formatDateTime, getInitials } from '@/lib/utils';
import styles from './shared.module.css';

export default function SharedNotePage() {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await sharedAPI.getNote(shareId);
        setNote(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Note not found');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [shareId]);

  if (loading) {
    return (
      <div className={styles.sharePage}>
        <div className={styles.shareCenter}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.sharePage}>
        <div className={styles.shareNav}>
          <div className={styles.shareNavInner}>
            <Link href="/" className={styles.shareLogo}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#share-logo)" />
                <path d="M8 9h12M8 14h8M8 19h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="share-logo" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <span className={styles.shareLogoText}>PEBLO Notes</span>
            </Link>
          </div>
        </div>
        <div className={styles.shareCenter}>
          <div className="empty-state">
            <div className="empty-state-icon">🔒</div>
            <h3 className="empty-state-title">{error}</h3>
            <p className="empty-state-text">This note may have been unshared or doesn&apos;t exist.</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sharePage}>
      {/* Nav */}
      <nav className={styles.shareNav}>
        <div className={styles.shareNavInner}>
          <Link href="/" className={styles.shareLogo}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#share-logo2)" />
              <path d="M8 9h12M8 14h8M8 19h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="share-logo2" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.shareLogoText}>PEBLO Notes</span>
          </Link>
          <span className={styles.shareBadge}>🔗 Shared Note</span>
        </div>
      </nav>

      {/* Content */}
      <article className={styles.shareContent}>
        <h1 className={styles.shareTitle}>{note.title || 'Untitled'}</h1>

        <div className={styles.shareMeta}>
          <div className={styles.shareAuthor}>
            <span className={styles.shareAuthorAvatar}>
              {getInitials(note.author)}
            </span>
            <span>{note.author}</span>
          </div>
          <span className={styles.shareDate}>
            {formatDateTime(note.updatedAt)}
          </span>
        </div>

        {note.tags?.length > 0 && (
          <div className={styles.shareTags}>
            {note.tags.map((tag) => (
              <span key={tag.id} className={styles.shareTag}>{tag.name}</span>
            ))}
          </div>
        )}

        <div className={styles.shareDivider} />

        <div className={`markdown-content ${styles.shareBody}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {note.content || '*No content*'}
          </ReactMarkdown>
        </div>

        {/* AI Summary */}
        {(note.summary || note.actionItems?.length > 0) && (
          <div className={styles.shareSummary}>
            {note.summary && (
              <>
                <h3 className={styles.shareSummaryTitle}>🤖 AI Summary</h3>
                <p className={styles.shareSummaryText}>{note.summary}</p>
              </>
            )}

            {note.actionItems?.length > 0 && (
              <div className={styles.shareActionItems}>
                <h4 className={styles.shareSummaryTitle}>📋 Action Items</h4>
                {note.actionItems.map((item, idx) => (
                  <div key={idx} className={styles.shareActionItem}>
                    <span className={styles.shareActionBullet} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
