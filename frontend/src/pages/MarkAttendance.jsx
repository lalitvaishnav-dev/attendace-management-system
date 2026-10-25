import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('Computer Science');
  const [departments, setDepartments] = useState([
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
  ]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [existingRecord, setExistingRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Load departments once
  useEffect(() => {
    fetch('/api/students/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setDepartments(data.data);
          if (!data.data.includes(department)) {
            setDepartment(data.data[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch students & any existing attendance for selected date & department
  useEffect(() => {
    loadClassAttendance();
  }, [date, department]);

  const loadClassAttendance = async () => {
    setLoading(true);
    setExistingRecord(false);

    try {
      // 1. Fetch live students for the department
      const studentsRes = await fetch(
        `/api/students?department=${encodeURIComponent(department)}`
      ).then((r) => r.json());

      const loadedStudents = studentsRes.data || [];
      setStudents(loadedStudents);

      // 2. Fetch existing attendance for this date & department
      const attRes = await fetch(
        `/api/attendance?date=${encodeURIComponent(date)}&department=${encodeURIComponent(department)}`
      ).then((r) => r.json());

      const newAttMap = {};
      const newRemMap = {};

      if (attRes.success && attRes.data && attRes.data.length > 0) {
        const session = attRes.data[0];
        setExistingRecord(true);

        session.records.forEach((rec) => {
          const sId = rec.student?._id || rec.student;
          if (sId) {
            newAttMap[sId] = rec.status || 'Present';
            newRemMap[sId] = rec.remarks || '';
          }
        });

        // Ensure every loaded student has an entry
        loadedStudents.forEach((s) => {
          if (!newAttMap[s._id]) {
            newAttMap[s._id] = 'Present';
          }
        });
      } else {
        // Default all to Present
        loadedStudents.forEach((s) => {
          newAttMap[s._id] = 'Present';
          newRemMap[s._id] = '';
        });
      }

      setAttendanceMap(newAttMap);
      setRemarksMap(newRemMap);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = (id, status) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: status }));
  };

  const handleRemarkChange = (id, text) => {
    setRemarksMap((prev) => ({ ...prev, [id]: text }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      showToast('No students to save attendance for.', 'error');
      return;
    }

    setIsSaving(true);

    const records = students.map((s) => ({
      student: s._id,
      status: attendanceMap[s._id] || 'Present',
      remarks: remarksMap[s._id] || '',
    }));

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          department,
          records,
          markedBy: 'Faculty Admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setExistingRecord(true);
        showToast(`Attendance saved successfully for ${department}!`, 'success');
      } else {
        showToast(data.message || 'Failed to save attendance', 'error');
      }
    } catch {
      showToast('Network error while saving attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'Late').length;

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            background: toast.type === 'error' ? '#fff1f2' : '#ecfdf5',
            color: toast.type === 'error' ? '#9f1239' : '#065f46',
            border: `1px solid ${toast.type === 'error' ? '#fecdd3' : '#a7f3d0'}`,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">
            Record, review, and synchronize daily class attendance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleSaveAttendance}
            className="btn btn-primary"
            disabled={isSaving || students.length === 0}
            style={{ minWidth: '160px' }}
          >
            {isSaving ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          alignItems: 'end',
        }}>
          <div>
            <label className="form-label">Attendance Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Department / Branch</label>
            <select
              className="form-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Batch Quick Actions</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => markAll('Present')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5' }}
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('Absent')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, color: '#be123c', borderColor: '#fecdd3', background: '#fff1f2' }}
              >
                All Absent
              </button>
              <button
                type="button"
                onClick={() => markAll('Late')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
              >
                All Late
              </button>
            </div>
          </div>
        </div>

        {/* Existing Record Alert Banner */}
        {existingRecord && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>ℹ️</span>
            <span>
              Attendance record already exists for <strong>{department}</strong> on <strong>{date}</strong>. Loaded current statuses for modification.
            </span>
          </div>
        )}

        {/* Live Counters */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}>
          <span style={{ color: '#475569' }}>
            Class Roster: <strong style={{ color: '#0f172a' }}>{students.length}</strong>
          </span>
          <span style={{ color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            Present: {presentCount}
          </span>
          <span style={{ color: '#e11d48', background: '#fff1f2', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            Absent: {absentCount}
          </span>
          <span style={{ color: '#d97706', background: '#fffbeb', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            Late: {lateCount}
          </span>
        </div>
      </div>

      {/* Roster & Marking Table */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 1rem' }}>
            <div className="spinner"></div>
            <span style={{ marginLeft: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
              Loading students for {department}...
            </span>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <div className="empty-state-title">No Students Registered in {department}</div>
            <p className="empty-state-text">
              To mark attendance for this department, you need to register students first.
            </p>
            <button
              onClick={() => navigate('/students')}
              className="btn btn-primary btn-sm"
            >
              + Register Students
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Roll Number</th>
                  <th>Student Name</th>
                  <th style={{ width: '280px', textAlign: 'center' }}>Attendance Status</th>
                  <th>Notes & Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const currentStatus = attendanceMap[student._id] || 'Present';
                  const currentRemark = remarksMap[student._id] || '';

                  return (
                    <tr key={student._id}>
                      <td>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#4f46e5',
                          background: '#eef2ff',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #c7d2fe',
                        }}>
                          {student.rollNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {student.year} • {student.email}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex',
                          background: '#f1f5f9',
                          padding: '0.25rem',
                          borderRadius: '8px',
                          gap: '0.25rem',
                        }}>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'Present')}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              backgroundColor: currentStatus === 'Present' ? '#059669' : 'transparent',
                              color: currentStatus === 'Present' ? '#ffffff' : '#475569',
                              boxShadow: currentStatus === 'Present' ? '0 1px 3px rgba(5, 150, 105, 0.3)' : 'none',
                            }}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'Absent')}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              backgroundColor: currentStatus === 'Absent' ? '#e11d48' : 'transparent',
                              color: currentStatus === 'Absent' ? '#ffffff' : '#475569',
                              boxShadow: currentStatus === 'Absent' ? '0 1px 3px rgba(225, 29, 72, 0.3)' : 'none',
                            }}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student._id, 'Late')}
                            style={{
                              padding: '0.35rem 0.85rem',
                              borderRadius: '6px',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              backgroundColor: currentStatus === 'Late' ? '#d97706' : 'transparent',
                              color: currentStatus === 'Late' ? '#ffffff' : '#475569',
                              boxShadow: currentStatus === 'Late' ? '0 1px 3px rgba(217, 119, 6, 0.3)' : 'none',
                            }}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Optional remarks (e.g. sick leave, late 10m)..."
                          value={currentRemark}
                          onChange={(e) => handleRemarkChange(student._id, e.target.value)}
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
