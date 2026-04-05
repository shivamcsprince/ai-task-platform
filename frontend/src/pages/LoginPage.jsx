import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card animate-fade-in">
        <div className="auth-card__brand">
          <span className="auth-brand-icon">⚡</span>
          <span className="auth-brand-name">TaskFlow</span>
        </div>

        <div className="auth-card__header">
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one →</Link>
        </p>
      </div>
    </div>
  );
}
