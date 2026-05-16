'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { insightsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import styles from './insights.module.css';

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await insightsAPI.get();
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className={styles.insights}>
        <div className={styles.statsGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card" style={{ padding: 'var(--space-lg)' }}>
              <div className="skeleton" style={{ height: 48, width: '50%', margin: '0 auto var(--space-sm)' }} />
              <div className="skeleton" style={{ height: 16, width: '60%', margin: '0 auto' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxActivity = Math.max(
    ...data.weeklyActivity.map((d) => d.created + d.updated),
    1
  );
  const maxTagCount = Math.max(...data.topTags.map((t) => t.count), 1);

  return (
    <div className={styles.insights}>
      <div className={styles.insightsHeader}>
        <h1 className={styles.insightsTitle}>Productivity Insights</h1>
        <p className={styles.insightsSubtitle}>Your writing activity and workspace analytics</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={`${styles.statValue} gradient-text`}>{data.notes.total}</div>
          <div className={styles.statLabel}>Total Notes</div>
        </div>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={`${styles.statValue} gradient-text`}>{data.notes.active}</div>
          <div className={styles.statLabel}>Active Notes</div>
        </div>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={`${styles.statValue} gradient-text`}>{data.notes.archived}</div>
          <div className={styles.statLabel}>Archived</div>
        </div>
        <div className={`glass-card ${styles.statCard}`}>
          <div className={`${styles.statValue} gradient-text`}>{data.aiStats.total}</div>
          <div className={styles.statLabel}>AI Generations</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Weekly Activity */}
        <div className={`glass-card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Weekly Activity</h3>
          <div className={styles.activityChart}>
            {data.weeklyActivity.map((day, i) => (
              <div key={i} className={styles.activityBar}>
                <div className={styles.barStack}>
                  <div
                    className={styles.barCreated}
                    style={{
                      height: `${(day.created / maxActivity) * 120}px`,
                    }}
                  />
                  {day.updated > 0 && (
                    <div
                      className={styles.barUpdated}
                      style={{
                        height: `${(day.updated / maxActivity) * 120}px`,
                      }}
                    />
                  )}
                </div>
                <span className={styles.barLabel}>{day.day}</span>
              </div>
            ))}
          </div>
          <div className={styles.chartLegend}>
            <span>
              <span className={styles.legendDot} style={{ background: 'var(--accent-primary)' }} />
              Created
            </span>
            <span>
              <span className={styles.legendDot} style={{ background: 'rgba(6, 182, 212, 0.4)' }} />
              Updated
            </span>
          </div>
        </div>

        {/* Top Tags */}
        <div className={`glass-card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Most Used Tags</h3>
          {data.topTags.length > 0 ? (
            <div className={styles.tagsList}>
              {data.topTags.map((tag, i) => (
                <div key={i} className={styles.tagRow}>
                  <span className={styles.tagName}>{tag.name}</span>
                  <div className={styles.tagBarWrapper}>
                    <div
                      className={styles.tagBar}
                      style={{ width: `${(tag.count / maxTagCount) * 100}%` }}
                    />
                  </div>
                  <span className={styles.tagCount}>{tag.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
              <p className="empty-state-text">Add tags to your notes to see them here</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Notes & AI Stats */}
      <div className={styles.chartsRow}>
        {/* Recently Edited */}
        <div className={`glass-card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Recently Edited</h3>
          {data.recentlyEdited.length > 0 ? (
            <div className={styles.recentList}>
              {data.recentlyEdited.map((note) => (
                <div
                  key={note.id}
                  className={styles.recentItem}
                  onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                >
                  <span className={styles.recentItemTitle}>{note.title || 'Untitled'}</span>
                  <span className={styles.recentItemDate}>{formatDate(note.updatedAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
              <p className="empty-state-text">No recent activity this week</p>
            </div>
          )}
        </div>

        {/* AI Usage */}
        <div className={`glass-card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>AI Usage Statistics</h3>
          <div className={styles.aiStatsGrid}>
            <div className={styles.aiStatCard}>
              <div className={`${styles.aiStatValue} gradient-text`}>{data.aiStats.total}</div>
              <div className={styles.aiStatLabel}>Total</div>
            </div>
            <div className={styles.aiStatCard}>
              <div className={`${styles.aiStatValue} gradient-text`}>{data.aiStats.summary}</div>
              <div className={styles.aiStatLabel}>Summaries</div>
            </div>
            <div className={styles.aiStatCard}>
              <div className={`${styles.aiStatValue} gradient-text`}>
                {data.aiStats.action_items + data.aiStats.title_suggestion}
              </div>
              <div className={styles.aiStatLabel}>Other</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
