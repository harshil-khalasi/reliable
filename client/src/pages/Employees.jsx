import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Users,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Building,
  RotateCcw,
  X,
} from 'lucide-react';
import { employeeApi } from '../api/employeeApi';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Product',
];

const Employees = () => {
  const { isAdmin, user, refreshUser } = useAuth();

  // Protect route - only Admins can access employee directory & management
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Data & State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // Check if any filter/search is currently applied
  const hasActiveFilters = Boolean(
    search.trim() !== '' ||
    department !== 'All' ||
    status !== 'All' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc'
  );

  const handleClearFilters = () => {
    setSearch('');
    setDepartment('All');
    setStatus('All');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetailData, setEmployeeDetailData] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: 'Engineering',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  });

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await employeeApi.getEmployees({
        search,
        department,
        status,
        sortBy,
        sortOrder,
        page,
        limit: 8,
      });

      if (data.success) {
        setEmployees(data.employees);
        setTotalPages(data.totalPages);
        setTotalEmployees(data.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  }, [search, department, status, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchEmployees();

    const handleFocus = () => fetchEmployees();
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(fetchEmployees, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchEmployees]);

  // Field-level inline validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
    joiningDate: '',
  });

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) error = 'Employee Name is required.';
      else if (value.trim().length < 2) error = 'Name must be at least 2 characters.';
    } else if (name === 'email') {
      if (!value.trim()) error = 'Email is required.';
      else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value.trim())) {
        error = 'Enter a valid email address (e.g. name@company.com).';
      }
    } else if (name === 'phone') {
      if (!value.trim()) error = 'Phone number is required.';
      else if (!/^[0-9]{10}$/.test(value.trim())) {
        error = 'Phone number must be exactly 10 digits.';
      }
    } else if (name === 'designation') {
      if (!value.trim()) error = 'Designation is required.';
      else if (value.trim().length < 2) error = 'Designation must be at least 2 characters.';
    } else if (name === 'joiningDate') {
      if (!value) error = 'Joining Date is required.';
    }
    return error;
  };

  // Handle Form Change with instant validation
  const handleInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      designation: '',
      department: 'Engineering',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      password: '',
    });
    setFormError('');
    setFieldErrors({ name: '', email: '', phone: '', designation: '', joiningDate: '' });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      designation: emp.designation,
      department: emp.department,
      joiningDate: new Date(emp.joiningDate).toISOString().split('T')[0],
      status: emp.status,
      password: '',
    });
    setFormError('');
    setFieldErrors({ name: '', email: '', phone: '', designation: '', joiningDate: '' });
    setIsFormModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetailModal = async (emp) => {
    try {
      setIsDetailModalOpen(true);
      setEmployeeDetailData(null);
      const data = await employeeApi.getEmployeeById(emp._id);
      if (data.success) {
        setEmployeeDetailData(data);
      }
    } catch (err) {
      console.error('Error fetching employee details:', err.message);
    }
  };

  // Submit Create or Edit Form with full validation pass
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      designation: validateField('designation', formData.designation),
      joiningDate: validateField('joiningDate', formData.joiningDate),
    };
    setFieldErrors(errors);

    const hasErrors = Object.values(errors).some((err) => !!err);
    if (hasErrors) {
      setFormError('Please resolve all validation errors highlighted below.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (selectedEmployee) {
        // Update
        await employeeApi.updateEmployee(selectedEmployee._id, formData);
        setSuccessMessage(`Employee '${formData.name}' updated successfully.`);
      } else {
        // Create
        await employeeApi.createEmployee(formData);
        setSuccessMessage(`Employee '${formData.name}' created successfully.`);
      }

      setIsFormModalOpen(false);
      fetchEmployees();
      if (refreshUser) refreshUser();

      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to save employee. Check if email is already in use.'
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm and Delete
  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    try {
      setFormSubmitting(true);
      await employeeApi.deleteEmployee(selectedEmployee._id);
      setIsDeleteModalOpen(false);
      setSuccessMessage(`Employee '${selectedEmployee.name}' deleted successfully.`);
      fetchEmployees();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Directory</h1>
          <p className="page-subtitle">
            Manage company personnel, designations, departments, and active statuses.
          </p>
        </div>

        {isAdmin ? (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Employee</span>
          </button>
        ) : (
          <div
            style={{
              fontSize: '0.825rem',
              color: '#475569',
              backgroundColor: '#f1f5f9',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontWeight: 500,
            }}
          >
            🔒 View-Only Directory (Admin role required for Add/Edit/Delete)
          </div>
        )}
      </div>

      {/* Global Notifications */}
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

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or designation..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ paddingRight: search ? '2.5rem' : '0.875rem' }}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                title="Clear search"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="form-control form-select"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '140px' }}>
            <select
              className="form-control form-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Sort Control */}
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-control form-select"
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              title="Sort Employees"
            >
              <option value="createdAt:desc">Recently Added</option>
              <option value="createdAt:asc">Oldest Added</option>
              <option value="joiningDate:desc">Joining Date (Newest First)</option>
              <option value="joiningDate:asc">Joining Date (Oldest First)</option>
              <option value="name:asc">Name (A → Z)</option>
              <option value="name:desc">Name (Z → A)</option>
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

      {/* Employees Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Contact Details</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Joining Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #e2e8f0',
                      borderTopColor: '#4f46e5',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 0.5rem',
                    }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading employees...</p>
                </td>
              </tr>
            ) : employees.length > 0 ? (
              employees.map((emp) => (
                <tr key={emp._id}>
                  {/* Name + Avatar */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: emp.status === 'Active' ? '#e0e7ff' : '#f1f5f9',
                          color: emp.status === 'Active' ? '#4f46e5' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {emp._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={13} color="#94a3b8" />
                      <span>{emp.email}</span>
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <Phone size={13} color="#94a3b8" />
                      <span>{emp.phone}</span>
                    </div>
                  </td>

                  {/* Designation */}
                  <td>
                    <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{emp.designation}</span>
                  </td>

                  {/* Department */}
                  <td>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                      }}
                    >
                      {emp.department}
                    </span>
                  </td>

                  {/* Joining Date */}
                  <td>
                    <span style={{ fontSize: '0.825rem', color: '#475569' }}>
                      {new Date(emp.joiningDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                      {emp.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenDetailModal(emp)}
                        title="View Full Profile"
                      >
                        <Eye size={16} />
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(emp)}
                            title="Edit Employee"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Employee"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Users size={48} />
                    <h3>No employees match your search</h3>
                    <p style={{ fontSize: '0.85rem' }}>
                      Try adjusting the search query or department filter.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalEmployees}
          pageSize={8}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedEmployee ? 'Edit Employee Details' : 'Add New Employee'}
        maxWidth="600px"
      >
        {formError && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={17} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="form-grid-two-col">
            {/* Name */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Employee Full Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleInputChange}
                style={fieldErrors.name ? { borderColor: '#ef4444' } : {}}
                required
              />
              {fieldErrors.name && <div className="form-error">{fieldErrors.name}</div>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address (Unique) *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="rahul@company.com"
                value={formData.email}
                onChange={handleInputChange}
                style={fieldErrors.email ? { borderColor: '#ef4444' } : {}}
                required
              />
              {fieldErrors.email && <div className="form-error">{fieldErrors.email}</div>}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="9876543210"
                maxLength={10}
                value={formData.phone}
                onChange={handleInputChange}
                style={fieldErrors.phone ? { borderColor: '#ef4444' } : {}}
                required
              />
              {fieldErrors.phone && <div className="form-error">{fieldErrors.phone}</div>}
            </div>

            {/* Designation */}
            <div className="form-group">
              <label className="form-label">Designation / Role *</label>
              <input
                type="text"
                name="designation"
                className="form-control"
                placeholder="e.g. Senior Frontend Engineer"
                value={formData.designation}
                onChange={handleInputChange}
                style={fieldErrors.designation ? { borderColor: '#ef4444' } : {}}
                required
              />
              {fieldErrors.designation && <div className="form-error">{fieldErrors.designation}</div>}
            </div>

            {/* Department */}
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                name="department"
                className="form-control form-select"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Joining Date */}
            <div className="form-group">
              <label className="form-label">Joining Date *</label>
              <input
                type="date"
                name="joiningDate"
                className="form-control"
                value={formData.joiningDate}
                onChange={handleInputChange}
                style={fieldErrors.joiningDate ? { borderColor: '#ef4444' } : {}}
                required
              />
              {fieldErrors.joiningDate && <div className="form-error">{fieldErrors.joiningDate}</div>}
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Employment Status *</label>
              <select
                name="status"
                className="form-control form-select"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Login Password */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">
                {selectedEmployee ? 'Reset Login Password (Optional)' : 'Login Password (for Employee Portal)'}
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder={
                  selectedEmployee
                    ? 'Leave blank to retain current password'
                    : 'e.g. employee123 (defaults to employee123 if blank)'
                }
                value={formData.password}
                onChange={handleInputChange}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                {selectedEmployee
                  ? 'Enter a new password if this employee requested a password reset.'
                  : 'Default is employee123. The employee can use this to sign in and view their assigned projects.'}
              </span>
            </div>
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
            <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
              {formSubmitting
                ? 'Saving...'
                : selectedEmployee
                ? 'Update Employee'
                : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail & Assigned Projects Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Employee Profile Details"
        maxWidth="550px"
      >
        {employeeDetailData ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e7ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                }}
              >
                {employeeDetailData.employee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  {employeeDetailData.employee.name}
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {employeeDetailData.employee.designation} • {employeeDetailData.employee.department}
                </p>
              </div>
            </div>

            <div
              className="form-grid-two-col"
              style={{
                backgroundColor: '#f8fafc',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {employeeDetailData.employee.email}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Phone</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {employeeDetailData.employee.phone}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Joining Date</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {new Date(employeeDetailData.employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Status</span>
                <span className={`badge ${employeeDetailData.employee.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                  {employeeDetailData.employee.status}
                </span>
              </div>
            </div>

            {/* Assigned Projects Section */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Assigned Projects ({employeeDetailData.assignedProjects?.length || 0})
              </h4>
              {employeeDetailData.assignedProjects && employeeDetailData.assignedProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {employeeDetailData.assignedProjects.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Deadline: {new Date(p.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge badge-in-progress" style={{ fontSize: '0.7rem' }}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  This employee is not currently assigned to any projects.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading details...</div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to delete employee "${selectedEmployee?.name}"? They will automatically be unassigned from all active projects.`}
        confirmText="Confirm Delete"
        isDeleting={formSubmitting}
      />
    </div>
  );
};

export default Employees;
