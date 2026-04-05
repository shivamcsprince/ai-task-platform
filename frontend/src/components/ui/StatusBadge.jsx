import React from 'react';
import './StatusBadge.css';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  dot: true },
  running:  { label: 'Running',  dot: true, pulse: true },
  success:  { label: 'Success',  dot: false },
  failed:   { label: 'Failed',   dot: false },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, dot: false };

  return (
    <span className={`status-badge status-badge--${status}`}>
      {config.dot && (
        <span className={`status-dot ${config.pulse ? 'status-dot--pulse' : ''}`} />
      )}
      {config.label}
    </span>
  );
}
