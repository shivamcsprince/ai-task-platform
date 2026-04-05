import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/tasks/TaskCard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import './DashboardPage.css';

const STATUS_FILTERS = ['all', 'pending', 'running', 'success', 'failed'];

const STAT_CONFIG = [
  { key: 'total',   label: 'Total Tasks',  color: 'accent' },
  { key: 'pending', label: 'Pending',      color: 'pending' },
  { key: 'running', label: 'Running',      color: 'running' },
  { key: 'success', label: 'Completed',    color: 'success' },
  { key: 'failed',  label: 'Failed',       color: 'error' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [stats, setStats] = useState({});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (filter !== 'all') params.status = filter;
      const { data } = await tasksAPI.list(params);
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const statuses = ['pending', 'running', 'success', 'failed'];
      const results = await Promise.all(
        statuses.map((s) => tasksAPI.list({ status: s, page: 1 }))
      );
      const computed = { total: 0 };
      statuses.forEach((s, i) => {
        computed[s] = results[i].data.data.pagination.total;
        computed.total += computed[s];
      });
      setStats(computed);
    } catch {
      // Non-critical — silently fail
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds to catch worker updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Auto-refresh if any task is running
  useEffect(() => {
    const hasRunning = tasks.some((t) => t.status === 'running' || t.status === 'pending');
    if (!hasRunning) return;
    const interval = setInterval(fetchTasks, 4000);
    return () => clearInterval(interval);
  }, [tasks, fetchTasks]);

  async function handleRun(taskId) {
    setRunningId(taskId);
    try {
      await tasksAPI.run(taskId);
      await fetchTasks();
      await fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run task');
    } finally {
      setRunningId(null);
    }
  }

  async function handleCreateTask(formData) {
    await tasksAPI.create(formData);
    setPage(1);
    setFilter('all');
    await fetchTasks();
    await fetchStats();
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
    setPage(1);
  }

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back, <strong>{user?.name}</strong>
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          + New Task
        </Button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="stats-bar">
        {STAT_CONFIG.map(({ key, label, color }) => (
          <div key={key} className={`stat-card stat-card--${color}`}>
            <span className="stat-card__value">{stats[key] ?? '—'}</span>
            <span className="stat-card__label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div className="filter-tabs">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`}
            onClick={() => handleFilterChange(f)}
          >
            {f === 'all' ? 'All' : <StatusBadge status={f} />}
          </button>
        ))}
      </div>

      {/* ── Task Grid ── */}
      {loading && (
        <div className="task-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="task-skeleton">
              <div className="skeleton" style={{ height: 14, width: '60%' }} />
              <div className="skeleton" style={{ height: 20, width: '80%', marginTop: 8 }} />
              <div className="skeleton" style={{ height: 60, marginTop: 12 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="dashboard__error">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchTasks}>Retry</Button>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="dashboard__empty">
          <div className="empty-icon">📭</div>
          <h3>No tasks yet</h3>
          <p>Create your first task to get started with async processing.</p>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Create Task
          </Button>
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <>
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onRun={handleRun}
                runningId={runningId}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </Button>
              <span className="pagination__info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Create Task Modal ── */}
      {showModal && (
        <CreateTaskModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreateTask}
        />
      )}
    </div>
  );
}
