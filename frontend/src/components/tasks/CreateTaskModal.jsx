import React, { useState } from 'react';
import Button from '../ui/Button';
import './CreateTaskModal.css';

const OPERATIONS = [
  { value: 'uppercase',   label: 'Uppercase',    desc: 'Convert text to UPPERCASE' },
  { value: 'lowercase',   label: 'Lowercase',    desc: 'Convert text to lowercase' },
  { value: 'reverse',     label: 'Reverse',      desc: 'Reverse the entire string' },
  { value: 'word_count',  label: 'Word Count',   desc: 'Analyze word & character stats' },
];

export default function CreateTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', inputText: '', operation: 'uppercase' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.inputText.trim()) errs.inputText = 'Input text is required';
    if (form.inputText.length > 10000) errs.inputText = 'Max 10,000 characters';
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
      await onCreated(form);
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="modal__header">
          <h2 className="modal__title">New Task</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form">
          {apiError && <div className="form-error-banner">{apiError}</div>}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              className={`form-input ${errors.title ? 'form-input--error' : ''}`}
              type="text"
              placeholder="e.g. Process product descriptions"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={100}
              autoFocus
            />
            {errors.title && <span className="form-field-error">{errors.title}</span>}
          </div>

          {/* Operation */}
          <div className="form-group">
            <label className="form-label">Operation</label>
            <div className="operation-grid">
              {OPERATIONS.map((op) => (
                <button
                  key={op.value}
                  type="button"
                  className={`operation-card ${form.operation === op.value ? 'operation-card--selected' : ''}`}
                  onClick={() => handleChange('operation', op.value)}
                >
                  <span className="operation-card__label">{op.label}</span>
                  <span className="operation-card__desc">{op.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Text */}
          <div className="form-group">
            <label className="form-label">
              Input Text
              <span className="form-label__count">{form.inputText.length}/10,000</span>
            </label>
            <textarea
              className={`form-textarea ${errors.inputText ? 'form-input--error' : ''}`}
              placeholder="Enter the text you want to process..."
              value={form.inputText}
              onChange={(e) => handleChange('inputText', e.target.value)}
              rows={6}
              maxLength={10000}
            />
            {errors.inputText && <span className="form-field-error">{errors.inputText}</span>}
          </div>

          <div className="modal__actions">
            <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={loading}>Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
