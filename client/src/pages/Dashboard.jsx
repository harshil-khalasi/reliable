import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  TrendingUp,
  UserCheck,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboardApi';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setError('');
      const data = await dashboardApi.getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto update metrics when window gains focus or tab becomes active
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);

    // Auto-sync polling every 8 seconds
    const interval = setInterval(fetchStats, 8000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'badge-priority-high';
      case 'Medium':
        return 'badge-priority-medium';
      case 'Low':
      default:
        return 'badge-priority-low';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'badge-completed';
      case 'In Progress':
        return 'badge-in-progress';
      case 'Pending':
      default:
        return 'badge-pending';
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          {!isAdmin && <h1 className="page-title">Employee Workspace</h1>}
          <p className="page-subtitle" style={isAdmin ? { margin: 0 } : {}}>
            {isAdmin
              ? 'Overview of workforce metrics, department distribution, and active project lifecycles.'
              : 'Overview of your assigned deliverables, project status breakdown, and team directory.'}
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/projects')}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Grid */}
      <div className="stat-grid">
        {isAdmin && (
          <StatCard
            label="Total Employees"
            value={stats?.totalEmployees || 0}
            hint={`${stats?.activeEmployees || 0} Active • ${stats?.inactiveEmployees || 0} Inactive`}
            icon={Users}
            color="#4f46e5"
            bgLight="#e0e7ff"
            onClick={() => navigate('/employees')}
          />
        )}
        <StatCard
          label={isAdmin ? 'Total Projects' : 'My Assigned Projects'}
          value={stats?.totalProjects || 0}
          hint={`${stats?.pendingProjects || 0} Pending`}
          icon={FolderKanban}
          color="#0284c7"
          bgLight="#e0f2fe"
          onClick={() => navigate('/projects')}
        />
        <StatCard
          label={isAdmin ? 'Projects In Progress' : 'My In Progress'}
          value={stats?.projectsInProgress || 0}
          hint="Active execution phase"
          icon={Clock}
          color="#d97706"
          bgLight="#fef3c7"
          onClick={() => navigate('/projects?status=In Progress')}
        />
        <StatCard
          label="Completed Projects"
          value={stats?.completedProjects || 0}
          hint="Delivered on schedule"
          icon={CheckCircle2}
          color="#059669"
          bgLight="#d1fae5"
          onClick={() => navigate('/projects?status=Completed')}
        />
      </div>

      {/* Grid: Department Distribution + Priority Metrics */}
      {isAdmin ? (
        <div className="dashboard-two-col-grid">
          {/* Department Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Department Workforce
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {stats?.departmentBreakdown?.length || 0} Departments
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {stats?.departmentBreakdown && stats.departmentBreakdown.length > 0 ? (
                stats.departmentBreakdown.map((item) => {
                  const percentage = stats.totalEmployees > 0
                    ? Math.round((item.count / stats.totalEmployees) * 100)
                    : 0;

                  return (
                    <div key={item.department}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.department}</span>
                        <span style={{ color: '#64748b' }}>
                          {item.count} employees ({percentage}%)
                        </span>
                      </div>
                      <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                            borderRadius: '9999px',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employee departments found.</p>
              )}
            </div>
          </div>

          {/* Priority & Operational Health */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Projects by Priority
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Portfolio Health
              </span>
            </div>

            <div className="priority-summary-grid">
              <div
                onClick={() => navigate('/projects?priority=High')}
                style={{ padding: '1rem', background: '#fee2e2', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to view High Priority projects"
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b' }}>
                  {stats?.highPriorityProjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
                  High Priority
                </div>
              </div>

              <div
                onClick={() => navigate('/projects?priority=Medium')}
                style={{ padding: '1rem', background: '#fef3c7', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to view Medium Priority projects"
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e' }}>
                  {stats?.mediumPriorityProjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                  Medium Priority
                </div>
              </div>

              <div
                onClick={() => navigate('/projects?priority=Low')}
                style={{ padding: '1rem', background: '#dbeafe', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to view Low Priority projects"
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af' }}>
                  {stats?.lowPriorityProjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  Low Priority
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#d1fae5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    Workforce Active Rate
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {stats?.totalEmployees > 0
                      ? `${Math.round(((stats?.activeEmployees || 0) / stats.totalEmployees) * 100)}% active employees`
                      : '100%'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/employees')}
                className="btn btn-secondary btn-sm"
              >
                <span>Manage</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-two-col-grid">
          {/* Projects by Priority for Employee */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                My Assigned Priority
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Urgency Breakdown
              </span>
            </div>

            <div className="priority-summary-grid">
              <div
                onClick={() => navigate('/projects?priority=High')}
                style={{ padding: '1rem', background: '#fee2e2', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to view My High Priority projects"
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b' }}>
                  {stats?.highPriorityProjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
                  High Priority
                </div>
              </div>

              <div
                onClick={() => navigate('/projects?priority=Medium')}
                style={{ padding: '1rem', background: '#fef3c7', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to view My Medium Priority projects"
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e' }}>
                  {stats?.mediumPriorityProjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                  Medium Priority
                </div>
              </div>

              <div
                onClick={() => navigate('/projects?priority=Low')}
                style={{ padding: '1rem', background: '#dbeafe', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to view My Low Priority projects"
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af' }}>
                  {stats?.lowPriorityProjects || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  Low Priority
                </div>
              </div>
            </div>
          </div>

          {/* Delivery & Progress Health */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Deliverables Completion
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Progress
              </span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Assigned Project Completion Rate</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {stats?.totalProjects > 0
                    ? `${Math.round(((stats?.completedProjects || 0) / stats.totalProjects) * 100)}%`
                    : '100%'}
                </span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats?.totalProjects > 0 ? Math.round(((stats?.completedProjects || 0) / stats.totalProjects) * 100) : 100}%`,
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                    borderRadius: '9999px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  View All Deliverables
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Track statuses, update progress, and view assigned deadlines
                </div>
              </div>
              <button
                onClick={() => navigate('/projects')}
                className="btn btn-primary btn-sm"
              >
                <span>Projects</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Projects Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Recent Projects Overview
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Last 5 managed projects with deadlines and assigned personnel
            </p>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-secondary btn-sm"
          >
            <span>View All Projects</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Assigned Team</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                stats.recentProjects.map((project) => (
                  <tr key={project._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {project.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.description}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(project.priority)}`}>
                        {project.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 500 }}>
                        {new Date(project.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
                          project.assignedEmployees.map((emp) => (
                            <span
                              key={emp._id}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 500,
                              }}
                            >
                              {emp.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No projects found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
