import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import './AuthPage.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  function field(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
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
          <h1 className="auth-card__title">Create account</h1>
          <p className="auth-card__subtitle">Start processing tasks in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {apiError && <div className="auth-error">{apiError}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              autoFocus
            />
            {errors.name && <span className="form-field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => field('email', e.target.value)}
            />
            {errors.email && <span className="form-field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${errors.password ? 'form-input--error' : ''}`}
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => field('password', e.target.value)}
            />
            {errors.password && <span className="form-field-error">{errors.password}</span>}
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
