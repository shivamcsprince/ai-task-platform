import React from 'react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth ? 'btn--full' : '',
        loading ? 'btn--loading' : '',
      ].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      <span className={loading ? 'btn__text--hidden' : ''}>{children}</span>
    </button>
  );
}
