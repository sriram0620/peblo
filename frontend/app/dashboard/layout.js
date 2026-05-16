'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, initialize, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Theme persistence
  useEffect(() => {
    const saved = localStorage.getItem('peblo_theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('peblo_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + N: New note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/dashboard');
      }
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('notes-search');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const navLinks = [
    { href: '/dashboard', icon: '📝', label: 'Notes' },
    { href: '/dashboard/insights', icon: '📊', label: 'Insights' },
  ];

  const getTitle = () => {
    if (pathname === '/dashboard') return 'Notes';
    if (pathname === '/dashboard/insights') return 'Insights';
    if (pathname.startsWith('/dashboard/notes/')) return 'Editor';
    return 'Dashboard';
  };

  return (
    <div className={styles.dashLayout}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.sidebarLogo}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#side-logo)" />
              <path d="M8 9h12M8 14h8M8 19h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="side-logo" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.sidebarLogoText}>PEBLO Notes</span>
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.sidebarLink} ${pathname === link.href ? styles.sidebarLinkActive : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.sidebarLinkIcon}>{link.icon}</span>
              {link.label}
            </Link>
          ))}

          <div className={styles.sidebarDivider} />

          <button className={styles.sidebarLink} onClick={handleLogout}>
            <span className={styles.sidebarLinkIcon}>🚪</span>
            Sign Out
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <div className={styles.sidebarAvatar}>
              {getInitials(user?.name)}
            </div>
            <div className={styles.sidebarUserInfo}>
              <div className={styles.sidebarUserName}>{user?.name}</div>
              <div className={styles.sidebarUserEmail}>{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              ☰
            </button>
            <h2 className={styles.topBarTitle}>{getTitle()}</h2>
          </div>
          <div className={styles.topBarActions}>
            <button className={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
