import React, { useState, useEffect } from 'react';
import StudentTable from '../components/StudentTable';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: 'Computer Science',
    year: '1st Year',
    contactNumber: '',
  });

  // Fetch departments and real students
  useEffect(() => {
    fetchDepartments();
    fetchStudents();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/students/departments');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setDepartments(data.data);
      }
    } catch {
      // Use fallback defaults
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStudents(data.data);
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      rollNumber: '',
      name: '',
      email: '',
      department: departments[0] || 'Computer Science',
      year: '1st Year',
      contactNumber: '',
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      year: student.year,
      contactNumber: student.contactNumber || '',
    });
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = Boolean(editingStudent && editingStudent._id);
      const url = isEdit ? `/api/students/${editingStudent._id}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        showToast(
          isEdit ? 'Student updated successfully!' : 'Student added successfully!',
          'success'
        );
        setShowModal(false);
        fetchStudents();
      } else {
        showToast(data.message || 'Operation failed. Please check inputs.', 'error');
      }
    } catch (err) {
      showToast('Network error while saving student.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Student deleted successfully', 'success');
        setStudents((prev) => prev.filter((s) => s._id !== id && s.rollNumber !== id));
      } else {
        showToast(data.message || 'Could not delete student', 'error');
      }
    } catch {
      showToast('Network error while deleting', 'error');
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesDept = deptFilter === 'All' || student.department === deptFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (student.name && student.name.toLowerCase().includes(q)) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(q)) ||
      (student.email && student.email.toLowerCase().includes(q));
    return matchesDept && matchesSearch;
  });

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            background: notification.type === 'error' ? '#fff1f2' : '#ecfdf5',
            color: notification.type === 'error' ? '#9f1239' : '#065f46',
            border: `1px solid ${notification.type === 'error' ? '#fecdd3' : '#a7f3d0'}`,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">
            Manage student enrollment, departments, and academic profiles
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={openAddModal} className="btn btn-primary">
            + Add New Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1', minWidth: '260px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search student by name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
              Department:
            </span>
            <select
              className="form-select"
              style={{ width: '220px' }}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments ({students.length})</option>
              {departments.map((dept) => {
                const count = students.filter((s) => s.department === dept).length;
                return (
                  <option key={dept} value={dept}>
                    {dept} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Student List Container */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 1rem' }}>
            <div className="spinner"></div>
            <span style={{ marginLeft: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
              Loading live student directory...
            </span>
          </div>
        ) : (
          <StudentTable
            students={filteredStudents}
            onDelete={handleDelete}
            onEdit={openEditModal}
          />
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. CS2026-001"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="e.g. student@edutrack.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-select"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year / Semester *</label>
                  <select
                    className="form-select"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
