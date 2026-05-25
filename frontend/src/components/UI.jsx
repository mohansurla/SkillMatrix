const getScoreClass = (score) => {
  if (score >= 85) return 'score-excellent';
  if (score >= 70) return 'score-good';
  if (score >= 50) return 'score-average';
  return 'score-poor';
};

export const ScoreCircle = ({ score, max = 100 }) => {
  const pct = Math.round((score / max) * 100);
  return (
    <div className={`score-circle ${getScoreClass(pct)}`}>
      {score}
    </div>
  );
};

export const ProgressBar = ({ value = 0, color, size = 'default', showLabel = true }) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const colorMap = {
    primary: '#0066cc',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    cyan: '#17a2b8',
  };
  const bg = colorMap[color] || colorMap.primary;

  return (
    <div className={`progress-bar-container progress-bar-${size}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted">Progress</span>
          <span className="text-sm font-semibold" style={{ color: '#0066cc' }}>{clampedValue}%</span>
        </div>
      )}
      <div className="progress-bar-wrap">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedValue}%`, background: bg }}
        />
      </div>
    </div>
  );
};

export const StatCard = ({ icon, label, value, color = 'primary', change, changeType }) => {
  const colorMap = {
    primary: '#0066cc',
    success: '#28a745',
    warning: '#856404',
    danger: '#dc3545',
    info: '#17a2b8',
    cyan: '#17a2b8',
  };

  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>
      <div className="stat-body">
        <div className="stat-value" style={{ color: colorMap[color] || '#333' }}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
        {change !== undefined && (
          <div className={`stat-change ${changeType === 'up' ? 'text-success' : 'text-danger'}`}>
            {changeType === 'up' ? '↑' : '↓'} {change}
          </div>
        )}
      </div>
    </div>
  );
};

export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <button
        className="btn btn-ghost btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>
      <div className="pagination-pages">
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              className={`pagination-page ${p === page ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}
      </div>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
};

export const EmptyState = ({ icon = '📭', title = 'Nothing here', description = '', action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop: 12 }}>{action}</div>}
  </div>
);

export const LoadingSpinner = ({ size = 'default' }) => (
  <div className="loading-overlay">
    <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />
  </div>
);

export const Badge = ({ children, variant = 'secondary' }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const Avatar = ({ name, size = 'md', color }) => (
  <div
    className={`avatar avatar-${size}`}
    style={{ background: color || '#0066cc' }}
  >
    {getInitials(name)}
  </div>
);

