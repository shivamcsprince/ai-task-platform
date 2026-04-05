import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import './TaskDetailPage.css';

const OPERATION_LABELS = {
  uppercase:  'Uppercase',
  lowercase:  'Lowercase',
  reverse:    'Reverse',
  word_count: 'Word Count',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function formatDuration(ms) {
  if (!ms) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      const { data } = await tasksAPI.get(id);
      setTask(data.data.task);
    } catch {
      setError('Task not found or you do not have access.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Poll while task is running
  useEffect(() => {
    if (!task) return;
    if (task.status !== 'running' && task.status !== 'pending') return;
    const interval = setInterval(fetchTask, 2000);
    return () => clearInterval(interval);
  }, [task, fetchTask]);

  async function handleRun() {
    setRunning(true);
    try {
      await tasksAPI.run(id);
      await fetchTask();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run task');
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner" />
        <span>Loading task...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <p>{error}</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>← Back</Button>
      </div>
    );
  }

  const canRun = task.status === 'pending' || task.status === 'failed';
  const duration = task.durationMs ? formatDuration(task.durationMs) : null;

  // Try to pretty-print JSON result (word_count returns JSON)
  let displayResult = task.result;
  if (task.result && task.operation === 'word_count') {
    try {
      displayResult = JSON.stringify(JSON.parse(task.result), null, 2);
    } catch { /* not JSON */ }
  }

  return (
    <div className="detail">
      {/* ── Header ── */}
      <div className="detail__header">
        <button className="detail__back" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <div className="detail__title-row">
          <div>
            <h1 className="detail__title">{task.title}</h1>
            <div className="detail__meta-row">
              <span className="detail__op-chip">{OPERATION_LABELS[task.operation]}</span>
              <StatusBadge status={task.status} />
              {duration && <span className="detail__duration">⏱ {duration}</span>}
            </div>
          </div>

          {canRun && (
            <Button variant="primary" size="md" loading={running} onClick={handleRun}>
              ▶ Run Task
            </Button>
          )}
        </div>
      </div>

      {/* ── Info Grid ── */}
      <div className="detail__info-grid">
        <InfoItem label="Created" value={formatDate(task.createdAt)} />
        <InfoItem label="Started" value={formatDate(task.startedAt)} />
        <InfoItem label="Completed" value={formatDate(task.completedAt)} />
        <InfoItem label="Status" value={<StatusBadge status={task.status} />} />
      </div>

      {/* ── Input ── */}
      <Section title="Input Text">
        <pre className="code-block">{task.inputText}</pre>
      </Section>

      {/* ── Result ── */}
      {task.result && (
        <Section title="Result" accent="success">
          <pre className="code-block code-block--success">{displayResult}</pre>
        </Section>
      )}

      {/* ── Logs ── */}
      <Section title="Execution Logs">
        {task.logs && task.logs.length > 0 ? (
          <div className="log-viewer">
            {task.logs.map((log, i) => (
              <div key={i} className={`log-line log-line--${log.level}`}>
                <span className="log-line__time">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`log-line__level log-line__level--${log.level}`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="log-line__msg">{log.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="log-empty">
            {task.status === 'pending'
              ? 'Task has not been run yet. Click "Run Task" to start.'
              : 'No logs recorded.'}
          </div>
        )}
      </Section>

      {/* ── Refresh hint for running tasks ── */}
      {(task.status === 'running' || task.status === 'pending') && (
        <div className="detail__polling-hint">
          <span className="status-dot status-dot--pulse" style={{ background: 'var(--running)', width: 8, height: 8, display: 'inline-block', borderRadius: '50%' }} />
          Auto-refreshing every 2 seconds...
          <Button variant="ghost" size="sm" onClick={fetchTask}>Refresh now</Button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, accent }) {
  return (
    <div className={`detail-section ${accent ? `detail-section--${accent}` : ''}`}>
      <h2 className="detail-section__title">{title}</h2>
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span className="info-item__label">{label}</span>
      <span className="info-item__value">{value}</span>
    </div>
  );
}
