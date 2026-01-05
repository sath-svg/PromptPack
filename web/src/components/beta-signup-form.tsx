'use client';

import { useState } from 'react';

export function BetaSignupForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Beta signup error:', error);
      setStatus('error');
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem 2rem',
      marginBottom: '2rem',
      maxWidth: '600px',
      margin: '0 auto 2rem auto'
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '0.5rem',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🚀 Looking for Beta Testers
      </h3>
      <p style={{
        fontSize: '0.95rem',
        color: 'var(--muted-foreground)',
        marginBottom: '1rem',
        lineHeight: '1.5'
      }}>
        Get early access to new features and discounted rates. Help shape the future of PromptPack!
      </p>

      {status === 'success' && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          color: '#22c55e',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}>
          ✓ Thanks for signing up! We'll be in touch soon.
        </div>
      )}

      {status === 'error' && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}>
          Something went wrong. Please try again.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          style={{
            flex: '1',
            minWidth: '200px',
            padding: '0.625rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            background: 'rgba(0, 0, 0, 0.2)',
            color: 'var(--foreground)',
            fontSize: '0.95rem'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'loading'}
          style={{ minWidth: '120px' }}
        >
          {status === 'loading' ? 'Joining...' : 'Join Beta'}
        </button>
      </form>
    </div>
  );
}
