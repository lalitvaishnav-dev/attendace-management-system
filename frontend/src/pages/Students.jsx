import React, { useState, useEffect } from 'react';
import StudentTable from '../components/StudentTable';

const initialStudents = [
  { _id: '1', rollNumber: 'CS2024-001', name: 'Aarav Sharma', email: 'aarav@edutrack.edu', department: 'Computer Science', year: '3rd Year', contactNumber: '+91 98765 43210' },
  { _id: '2', rollNumber: 'CS2024-002', name: 'Diya Patel', email: 'diya@edutrack.edu', department: 'Computer Science', year: '3rd Year', contactNumber: '+91 98765 43211' },
  { _id: '3', rollNumber: 'IT2024-010', name: 'Rohan Gupta', email: 'rohan@edutrack.edu', department: 'Information Technology', year: '2nd Year', contactNumber: '+91 98765 43212' },
  { _id: '4', rollNumber: 'EC2024-025', name: 'Ananya Verma', email: 'ananya@edutrack.edu', department: 'Electronics', year: '4th Year', contactNumber: '+91 98765 43213' },
  { _id: '5', rollNumber: 'CS2024-005', name: 'Vikram Singh', email: 'vikram@edutrack.edu', department: 'Computer Science', year: '3rd Year', contactNumber: '+91 98765 43214' },
];

const Students = () => {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    email: '',
    department: 'Computer Science',
    year: '1st Year',
    contactNumber: '',
  });

  // Fetch from backend API if available
  useEffect(() => {
    fetch('/api/students')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setStudents(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setStudents([...students, data.data]);
      } else {
        // Fallback local state update
        setStudents([...students, { ...formData, _id: Date.now().toString() }]);
      }
    } catch {
      setStudents([...students, { ...formData, _id: Date.now().toString() }]);
    }

    setShowModal(false);
    setFormData({
      rollNumber: '',
      name: '',
      email: '',
      department: 'Computer Science',
      year: '1st Year',
      contactNumber: '',
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      fetch(`/api/students/${id}`, { method: 'DELETE' }).catch(() => {});
      setStudents(students.filter((s) => (s._id || s.rollNumber) !== id));
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesDept = deptFilter === 'All' || student.department === deptFilter;
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">Manage student enrollment, departments, and records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          + Add New Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search student by name, roll no, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select
              className="form-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        <StudentTable
          students={filteredStudents}
          onDelete={handleDelete}
        />
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', background: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add New Student</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CS2024-006"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Student's name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@edutrack.edu"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
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
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 98765 00000"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Student
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
