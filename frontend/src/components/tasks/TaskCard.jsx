import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import './TaskCard.css';

const OPERATION_LABELS = {
  uppercase:  'Uppercase',
  lowercase:  'Lowercase',
  reverse:    'Reverse',
  word_count: 'Word Count',
};

export default function TaskCard({ task, onRun, runningId }) {
  const navigate = useNavigate();
  const isRunning = runningId === task._id;
  const canRun = task.status === 'pending' || task.status === 'failed';

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      className="task-card animate-fade-in"
      onClick={() => navigate(`/tasks/${task._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/tasks/${task._id}`)}
    >
      <div className="task-card__top">
        <div className="task-card__meta">
          <span className="task-card__op">{OPERATION_LABELS[task.operation] || task.operation}</span>
          <StatusBadge status={task.status} />
        </div>
        <time className="task-card__time">{timeAgo(task.createdAt)}</time>
      </div>

      <h3 className="task-card__title">{task.title}</h3>

      <p className="task-card__preview">
        {task.inputText.length > 80
          ? `${task.inputText.slice(0, 80)}…`
          : task.inputText}
      </p>

      {task.status === 'success' && task.result && (
        <div className="task-card__result">
          <span className="task-card__result-label">Result:</span>
          <span className="task-card__result-value">
            {task.result.length > 60 ? `${task.result.slice(0, 60)}…` : task.result}
          </span>
        </div>
      )}

      <div className="task-card__footer" onClick={(e) => e.stopPropagation()}>
        {canRun && (
          <Button
            variant="primary"
            size="sm"
            loading={isRunning}
            onClick={(e) => {
              e.stopPropagation();
              onRun(task._id);
            }}
          >
            ▶ Run
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/tasks/${task._id}`);
          }}
        >
          View Details →
        </Button>
      </div>
    </div>
  );
}
