import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  Users,
  Clock,
  CheckCircle2,
  FolderKanban,
  Flag,
  UserCheck,
  RotateCcw,
  X,
} from 'lucide-react';
import { projectApi } from '../api/projectApi';
import { employeeApi } from '../api/employeeApi';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];

const Projects = () => {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');
  const urlPriority = searchParams.get('priority');

  // State
  const [projects, setProjects] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'All');
  const [priorityFilter, setPriorityFilter] = useState(urlPriority || 'All');

  // Sync state if URL query params change
  useEffect(() => {
    if (urlStatus && ['Pending', 'In Progress', 'Completed'].includes(urlStatus)) {
      setStatusFilter(urlStatus);
    }
    if (urlPriority && ['Low', 'Medium', 'High'].includes(urlPriority)) {
      setPriorityFilter(urlPriority);
    }
  }, [urlStatus, urlPriority]);

  const hasActiveFilters = Boolean(
    search.trim() !== '' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All'
  );

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
  };

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium',
    status: 'Pending',
    assignedEmployees: [],
  });

  // Date validation message
  const [dateWarning, setDateWarning] = useState('');

  const fetchProjects = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      setError('');
      const data = await projectApi.getProjects({
        search,
        status: statusFilter,
        priority: priorityFilter,
      });

      if (data.success) {
        setProjects(data.projects);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch projects.');
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [search, statusFilter, priorityFilter]);

  const fetchEmployeesList = async () => {
    try {
      const data = await employeeApi.getAllEmployeesList();
      if (data.success) {
        setAllEmployees(data.employees);
      }
    } catch (err) {
      console.error('Failed to load employee directory for project dropdown:', err.message);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEmployeesList();

    // Auto update when window gains focus, tab becomes active, or data changes across app
    const handleFocus = () => fetchProjects(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProjects(true);
      }
    };
    const handleDataUpdated = () => fetchProjects(true);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('app:data-updated', handleDataUpdated);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('app:data-updated', handleDataUpdated);
    };
  }, [fetchProjects]);

  // Real-time check: deadline not before startDate
  useEffect(() => {
    if (formData.startDate && formData.deadline) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.deadline);
      if (end < start) {
        setDateWarning('Validation Error: The Deadline cannot be earlier than the Start Date.');
      } else {
        setDateWarning('');
      }
    }
  }, [formData.startDate, formData.deadline]);

  // Field-level inline validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    description: '',
    assignedEmployees: '',
  });

  const validateProjectField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) error = 'Project Name is required.';
      else if (value.trim().length < 3) error = 'Project Name must be at least 3 characters.';
    } else if (name === 'description') {
      if (!value.trim()) error = 'Project Description is required.';
      else if (value.trim().length < 10) error = 'Description must be at least 10 characters.';
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateProjectField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleEmployeeToggle = (empId) => {
    setFormData((prev) => {
      const current = prev.assignedEmployees || [];
      const updated = current.includes(empId)
        ? current.filter((id) => id !== empId)
        : [...current, empId];

      if (updated.length === 0) {
        setFieldErrors((f) => ({ ...f, assignedEmployees: 'At least one employee must be assigned (Requirement: one or more).' }));
      } else {
        setFieldErrors((f) => ({ ...f, assignedEmployees: '' }));
      }

      return { ...prev, assignedEmployees: updated };
    });
  };

  const handleOpenCreateModal = () => {
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'Medium',
      status: 'Pending',
      assignedEmployees: [],
    });
    setFormError('');
    setDateWarning('');
    setFieldErrors({ name: '', description: '', assignedEmployees: '' });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setSelectedProject(proj);
    setFormData({
      name: proj.name,
      description: proj.description,
      startDate: new Date(proj.startDate).toISOString().split('T')[0],
      deadline: new Date(proj.deadline).toISOString().split('T')[0],
      priority: proj.priority,
      status: proj.status,
      assignedEmployees: proj.assignedEmployees ? proj.assignedEmployees.map((e) => e._id || e) : [],
    });
    setFormError('');
    setDateWarning('');
    setFieldErrors({ name: '', description: '', assignedEmployees: '' });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = {
      name: validateProjectField('name', formData.name),
      description: validateProjectField('description', formData.description),
      assignedEmployees:
        formData.assignedEmployees.length === 0
          ? 'At least one employee must be assigned to the project.'
          : '',
    };
    setFieldErrors(errors);

    const hasFieldErrors = Object.values(errors).some((err) => !!err);
    if (hasFieldErrors || !!dateWarning) {
      setFormError('Please resolve all validation errors highlighted below.');
      return;
    }

    if (new Date(formData.deadline) < new Date(formData.startDate)) {
      setFormError('Validation Error: The Deadline cannot be before the Start Date.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (selectedProject) {
        await projectApi.updateProject(selectedProject._id, formData);
        setSuccessMessage(`Project '${formData.name}' updated successfully.`);
      } else {
        await projectApi.createProject(formData);
        setSuccessMessage(`Project '${formData.name}' created successfully.`);
      }

      setIsFormModalOpen(false);
      fetchProjects(true);
      window.dispatchEvent(new CustomEvent('app:data-updated'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save project.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    try {
      setFormSubmitting(true);
      await projectApi.deleteProject(selectedProject._id);
      setIsDeleteModalOpen(false);
      setSuccessMessage(`Project '${selectedProject.name}' deleted successfully.`);
      fetchProjects(true);
      window.dispatchEvent(new CustomEvent('app:data-updated'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick status update for regular users and admins
  const handleQuickStatusChange = async (proj, newStatus) => {
    try {
      // Optimistic instant state update without waiting for network
      setProjects((prev) =>
        prev.map((p) => (p._id === proj._id ? { ...p, status: newStatus } : p))
      );
      await projectApi.updateProject(proj._id, { status: newStatus });
      setSuccessMessage(`Status for '${proj.name}' changed to ${newStatus}.`);
      fetchProjects(true);
      window.dispatchEvent(new CustomEvent('app:data-updated'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      fetchProjects(true);
      setError(err.response?.data?.message || 'Failed to update project status.');
    }
  };

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

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Project Management' : 'My Assigned Projects'}</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Track deliverables, enforce deadline milestones, and allocate engineering personnel.'
              : 'View and manage deliverables and tasks assigned to you.'}
          </p>
        </div>

        {isAdmin && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="form-control"
              placeholder="Search projects by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: search ? '2.5rem' : '0.875rem' }}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((pr) => (
                <option key={pr} value={pr}>
                  {pr} Priority
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.625rem 0.95rem',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="Clear all filters and search"
            >
              <RotateCcw size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid / List View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 0.75rem',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading active projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map((proj) => {
            const isOverdue =
              new Date(proj.deadline) < new Date() && proj.status !== 'Completed';

            return (
              <div
                key={proj._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop:
                    proj.priority === 'High'
                      ? '4px solid #ef4444'
                      : proj.priority === 'Medium'
                      ? '4px solid #f59e0b'
                      : '4px solid #3b82f6',
                }}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className={`badge ${getPriorityBadgeClass(proj.priority)}`}>
                        {proj.priority}
                      </span>
                      <span className={`badge ${getStatusBadgeClass(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEditModal(proj)}
                          title="Edit Project"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => {
                            setSelectedProject(proj);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Project"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {proj.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.5',
                      marginBottom: '1.25rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {proj.description}
                  </p>
                </div>

                <div>
                  {/* Dates */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.775rem',
                      color: '#475569',
                      backgroundColor: '#f8fafc',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block' }}>Start Date</span>
                      <strong>
                        {new Date(proj.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: isOverdue ? '#dc2626' : '#94a3b8', display: 'block' }}>
                        {isOverdue ? '⚠️ Overdue' : 'Deadline'}
                      </span>
                      <strong style={{ color: isOverdue ? '#dc2626' : 'inherit' }}>
                        {new Date(proj.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                  </div>

                  {/* Assigned Employees */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                        marginBottom: '0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Users size={13} />
                      <span>
                        Assigned Personnel ({proj.assignedEmployees?.length || 0})
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {proj.assignedEmployees && proj.assignedEmployees.length > 0 ? (
                        proj.assignedEmployees.map((emp) => (
                          <span
                            key={emp._id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '9999px',
                              backgroundColor: '#e0e7ff',
                              color: '#4338ca',
                            }}
                          >
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                              }}
                            >
                              {emp.name.charAt(0)}
                            </span>
                            <span>{emp.name}</span>
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.775rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          No team members assigned yet.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Status Selector */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.85rem',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.775rem',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Quick Status:</span>
                    <select
                      value={proj.status}
                      onChange={(e) => handleQuickStatusChange(proj, e.target.value)}
                      className="form-control form-select"
                      style={{
                        padding: '0.25rem 1.6rem 0.25rem 0.6rem',
                        fontSize: '0.775rem',
                        width: 'auto',
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <FolderKanban size={48} />
            <h3>No projects found</h3>
            <p style={{ fontSize: '0.85rem' }}>
              Create your first project or adjust search filters above.
            </p>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedProject ? 'Edit Project' : 'Create New Project'}
        maxWidth="640px"
      >
        {formError && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={17} />
            <span>{formError}</span>
          </div>
        )}

        {dateWarning && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={17} />
            <span>{dateWarning}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. NextGen Microservices Architecture"
              value={formData.name}
              onChange={handleInputChange}
              style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
              required
            />
            {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows={3}
              placeholder="Detailed project requirements, goals, and scope (min 10 chars)..."
              value={formData.description}
              onChange={handleInputChange}
              style={fieldErrors.description ? { borderColor: '#ef4444' } : {}}
              required
            />
            {fieldErrors.description && <div className="form-error">{fieldErrors.description}</div>}
          </div>

          <div className="form-grid-two-col">
            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Deadline */}
            <div className="form-group">
              <label className="form-label">
                Deadline * {dateWarning && <span style={{ color: '#ef4444' }}>(Must be ≥ Start)</span>}
              </label>
              <input
                type="date"
                name="deadline"
                className="form-control"
                value={formData.deadline}
                onChange={handleInputChange}
                required
                style={dateWarning ? { borderColor: '#ef4444' } : {}}
              />
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority Level *</label>
              <select
                name="priority"
                className="form-control form-select"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                {PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Project Status *</label>
              <select
                name="status"
                className="form-control form-select"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Employees Multi-selection */}
          <div className="form-group">
            <label className="form-label">
              Assign Employees (One or More) *
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Select all team members responsible for this project delivery:
            </p>

            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                backgroundColor: '#ffffff',
              }}
            >
              {allEmployees.length > 0 ? (
                allEmployees.map((emp) => {
                  const isChecked = formData.assignedEmployees.includes(emp._id);
                  return (
                    <label
                      key={emp._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: isChecked ? '#e0e7ff' : '#f8fafc',
                        border: isChecked ? '1px solid #c7d2fe' : '1px solid transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleEmployeeToggle(emp._id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {emp.designation} • {emp.department}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}
                        style={{ fontSize: '0.65rem' }}
                      >
                        {emp.status}
                      </span>
                    </label>
                  );
                })
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No employees found in the directory.
                </p>
              )}
            </div>
            {fieldErrors.assignedEmployees && (
              <div className="form-error" style={{ marginTop: '0.4rem' }}>
                {fieldErrors.assignedEmployees}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formSubmitting || !!dateWarning}
            >
              {formSubmitting
                ? 'Saving...'
                : selectedProject
                ? 'Update Project'
                : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${selectedProject?.name}"? This action cannot be reversed.`}
        confirmText="Confirm Delete"
        isDeleting={formSubmitting}
      />
    </div>
  );
};

export default Projects;
