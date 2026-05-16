'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className={styles.landing}>
      {/* Hero section */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
                <path d="M8 9h12M8 14h8M8 19h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className={styles.logoText}>PEBLO Notes</span>
          </div>
          <div className={styles.navActions}>
            <button className="btn btn-ghost" onClick={() => router.push('/login')}>
              Log in
            </button>
            <button className="btn btn-primary" onClick={() => router.push('/signup')}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            AI-Powered Notes Workspace
          </div>
          <h1 className={styles.heroTitle}>
            Think. Write.{' '}
            <span className="gradient-text">Summarize.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Create, organize, and share notes with AI-powered summaries,
            intelligent action items, and real-time productivity insights —
            all in one beautiful workspace.
          </p>
          <div className={styles.heroCTA}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/signup')}>
              Start Writing — It&apos;s Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => router.push('/login')}>
              Sign In
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className={styles.features}>
          <div className={`glass-card ${styles.featureCard}`} style={{ animationDelay: '0.1s' }}>
            <div className={styles.featureIcon}>📝</div>
            <h3>Smart Notes</h3>
            <p>Create and organize notes with tags, categories, and full markdown support.</p>
          </div>
          <div className={`glass-card ${styles.featureCard}`} style={{ animationDelay: '0.2s' }}>
            <div className={styles.featureIcon}>🤖</div>
            <h3>AI Summaries</h3>
            <p>Generate intelligent summaries, action items, and title suggestions instantly.</p>
          </div>
          <div className={`glass-card ${styles.featureCard}`} style={{ animationDelay: '0.3s' }}>
            <div className={styles.featureIcon}>🔍</div>
            <h3>Instant Search</h3>
            <p>Find any note in seconds with powerful search, tag filtering, and smart sorting.</p>
          </div>
          <div className={`glass-card ${styles.featureCard}`} style={{ animationDelay: '0.4s' }}>
            <div className={styles.featureIcon}>🔗</div>
            <h3>Public Sharing</h3>
            <p>Share notes with a single click. Beautiful public pages, no login required.</p>
          </div>
          <div className={`glass-card ${styles.featureCard}`} style={{ animationDelay: '0.5s' }}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Insights Dashboard</h3>
            <p>Track your writing habits with weekly activity, top tags, and AI usage stats.</p>
          </div>
          <div className={`glass-card ${styles.featureCard}`} style={{ animationDelay: '0.6s' }}>
            <div className={styles.featureIcon}>🌙</div>
            <h3>Dark Mode</h3>
            <p>Beautiful dark and light themes with a premium glassmorphism design language.</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Built for the PEBLO Full Stack Developer Challenge</p>
      </footer>
    </div>
  );
}
