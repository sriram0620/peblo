import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'PEBLO Notes — AI-Powered Collaborative Workspace',
  description: 'A modern, AI-powered notes workspace for creating, organizing, and sharing notes with intelligent summaries, action items, and productivity insights.',
  keywords: 'notes, ai, workspace, productivity, collaboration, summary',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
