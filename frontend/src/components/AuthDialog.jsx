import { useState } from 'react';
import { ArrowUpRight, BookOpen, Check, Eye, EyeOff, X } from 'lucide-react';
import { apiRequest } from '../api.js';

export function AuthDialog({ initialMode = 'login', onClose, onSession }) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiRequest(`/auth/${mode === 'login' ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify(form) });
      onSession({ token, user });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        <span className="dialog-brand"><BookOpen size={19} /></span>
        <p className="eyebrow">A PLACE FOR YOUR WORDS</p>
        <h2 id="auth-title">{mode === 'login' ? 'Welcome back.' : 'Make room for ideas.'}</h2>
        <p className="auth-subtitle">{mode === 'login' ? 'Pick up where your reading left off.' : 'Create an account and start sharing what matters.'}</p>
        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button className={mode === 'login' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'register'} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label>Username<input autoComplete="username" required minLength="2" maxLength="30" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="What should we call you?" /></label>}
          <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" type="submit" disabled={loading}>{loading ? 'One moment...' : mode === 'login' ? 'Sign in' : 'Create account'}{!loading && <ArrowUpRight size={16} />}</button>
        </form>
        <p className="auth-footnote"><Check size={14} /> Your writing belongs to you.</p>
      </section>
    </div>
  );
}
