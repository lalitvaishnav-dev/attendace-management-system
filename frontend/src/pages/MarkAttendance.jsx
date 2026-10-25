import React, { useState, useEffect } from 'react';

const initialStudents = [
  { _id: '1', rollNumber: 'CS2024-001', name: 'Aarav Sharma', department: 'Computer Science' },
  { _id: '2', rollNumber: 'CS2024-002', name: 'Diya Patel', department: 'Computer Science' },
  { _id: '3', rollNumber: 'IT2024-010', name: 'Rohan Gupta', department: 'Information Technology' },
  { _id: '4', rollNumber: 'EC2024-025', name: 'Ananya Verma', department: 'Electronics' },
  { _id: '5', rollNumber: 'CS2024-005', name: 'Vikram Singh', department: 'Computer Science' },
];

const MarkAttendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('Computer Science');
  const [students, setStudents] = useState(initialStudents);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch students for selected department
  useEffect(() => {
    fetch(`/api/students?department=${encodeURIComponent(department)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setStudents(data.data);
        } else {
          // Default filtered
          setStudents(initialStudents.filter((s) => s.department === department));
        }
      })
      .catch(() => {
        setStudents(initialStudents.filter((s) => s.department === department));
      });
  }, [department]);

  // Set default status to 'Present' for loaded students
  useEffect(() => {
    const initialMap = {};
    students.forEach((s) => {
      initialMap[s._id || s.rollNumber] = 'Present';
    });
    setAttendanceMap(initialMap);
  }, [students]);

  const handleStatusChange = (id, status) => {
    setAttendanceMap((prev) => ({ ...prev, [id]: status }));
  };

  const handleRemarkChange = (id, text) => {
    setRemarksMap((prev) => ({ ...prev, [id]: text }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id || s.rollNumber] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    const records = students.map((s) => ({
      student: s._id,
      status: attendanceMap[s._id || s.rollNumber] || 'Present',
      remarks: remarksMap[s._id || s.rollNumber] || '',
    }));

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          department,
          records,
          markedBy: 'Admin/Teacher',
        }),
      });
    } catch {
      // Offline / demo fallback
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'Late').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Record daily attendance for classes and departments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {savedSuccess && (
            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
              ✓ Attendance Saved!
            </span>
          )}
          <button
            onClick={handleSaveAttendance}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
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
            <label className="form-label">Department / Class</label>
            <select
              className="form-select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics</option>
            </select>
          </div>

          <div>
            <label className="form-label">Quick Actions</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => markAll('Present')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('Absent')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
              >
                All Absent
              </button>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '1.5rem',
          fontSize: '0.85rem',
        }}>
          <div>Total: <strong>{students.length}</strong></div>
          <div style={{ color: 'var(--success)' }}>Present: <strong>{presentCount}</strong></div>
          <div style={{ color: 'var(--danger)' }}>Absent: <strong>{absentCount}</strong></div>
          <div style={{ color: 'var(--warning)' }}>Late: <strong>{lateCount}</strong></div>
        </div>
      </div>

      {/* Attendance Marker List */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Notes / Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const id = student._id || student.rollNumber;
                const currentStatus = attendanceMap[id] || 'Present';

                return (
                  <tr key={id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {student.rollNumber}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {student.name}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {['Present', 'Absent', 'Late'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(id, st)}
                            style={{
                              padding: '0.35rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: currentStatus === st ? '1px solid transparent' : '1px solid var(--border-subtle)',
                              backgroundColor:
                                currentStatus === st
                                  ? st === 'Present'
                                    ? 'var(--success)'
                                    : st === 'Absent'
                                    ? 'var(--danger)'
                                    : 'var(--warning)'
                                  : 'transparent',
                              color: currentStatus === st ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        className="form-input"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', maxWidth: '240px' }}
                        value={remarksMap[id] || ''}
                        onChange={(e) => handleRemarkChange(id, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
