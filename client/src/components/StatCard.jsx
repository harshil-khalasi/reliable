import React from 'react';

const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  color = '#4f46e5',
  bgLight = '#e0e7ff',
  onClick,
}) => {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      title={onClick ? `Click to view ${label}` : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value !== undefined ? value : '--'}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
      <div className="stat-icon" style={{ backgroundColor: bgLight, color: color }}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
};

export default StatCard;
