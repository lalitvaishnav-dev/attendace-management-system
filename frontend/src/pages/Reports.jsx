import React, { useState, useEffect } from 'react';

const Reports = () => {
  const [reportsData, setReportsData] = useState([]);
  const [departments, setDepartments] = useState([
    'Computer Science',
    'Information Technology',
    'Electronics',
    'Mechanical',
    'Civil',
  ]);
  const [department, setDepartment] = useState('All');
  const [filterLow, setFilterLow] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetch('/api/students/departments')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setDepartments(d.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadReports();
  }, [department]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const url =
        department === 'All'
          ? '/api/attendance/reports'
          : `/api/attendance/reports?department=${encodeURIComponent(department)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReportsData(data.data);
      } else {
        setReportsData([]);
      }
    } catch {
      setReportsData([]);
    } finally {
      setLoading(false);
    }
  };

  const openStudentHistory = async (student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    setStudentHistory(null);

    try {
      const res = await fetch(`/api/attendance/student/${student._id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStudentHistory(data.data);
      }
    } catch {
      setStudentHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredData = reportsData.filter((item) => {
    const matchesDept = department === 'All' || item.department === department;
    const matchesLow = filterLow ? item.percentage < 75 : true;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.rollNumber.toLowerCase().includes(q) ||
      (item.email && item.email.toLowerCase().includes(q));
    return matchesDept && matchesLow && matchesSearch;
  });

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = 'Roll Number,Name,Department,Year,Attended Classes,Total Classes,Attendance Percentage,Compliance Status\n';
    const rows = filteredData
      .map(
        (r) =>
          `"${r.rollNumber}","${r.name}","${r.department}","${r.year || ''}",${r.attended},${r.totalClasses},${r.percentage}%,${r.percentage >= 75 ? 'Compliant' : 'At-Risk'}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `edutrack_attendance_report_${department}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const averagePercentage =
    filteredData.length > 0
      ? (
          filteredData.reduce((acc, curr) => acc + curr.percentage, 0) /
          filteredData.length
        ).toFixed(1)
      : 0;

  const atRiskCount = filteredData.filter((r) => r.percentage < 75).length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Reports & Compliance</h1>
          <p className="page-subtitle">
            Auditable attendance analytics, compliance thresholds, and CSV data export
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="btn btn-primary">
            📥 Export to CSV
          </button>
          <button
            onClick={loadReports}
            className="btn btn-secondary"
            title="Refresh reports data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-title">Average Attendance</div>
            <div className="stat-value">{averagePercentage}%</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Across {filteredData.length} active students
            </div>
          </div>
          <div
            className="stat-icon"
            style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}
          >
            📊
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Students Evaluated</div>
            <div className="stat-value">{filteredData.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              {department === 'All' ? 'All departments' : department}
            </div>
          </div>
          <div
            className="stat-icon"
            style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}
          >
            👨‍🎓
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Below 75% (At-Risk)</div>
            <div
              className="stat-value"
              style={{ color: atRiskCount > 0 ? '#e11d48' : '#059669' }}
            >
              {atRiskCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              {atRiskCount > 0 ? 'Mandatory notice recommended' : 'All students compliant'}
            </div>
          </div>
          <div
            className="stat-icon"
            style={{
              backgroundColor: atRiskCount > 0 ? '#fff1f2' : '#ecfdf5',
              border: `1px solid ${atRiskCount > 0 ? '#fecdd3' : '#a7f3d0'}`,
            }}
          >
            {atRiskCount > 0 ? '⚠️' : '✅'}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ minWidth: '220px', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search student name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ width: '220px' }}>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterLow}
                onChange={(e) => setFilterLow(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
              />
              Show Only Low Attendance (&lt; 75%)
            </label>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            Showing <strong>{filteredData.length}</strong> students
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 1rem' }}>
            <div className="spinner"></div>
            <span style={{ marginLeft: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
              Generating attendance compliance report...
            </span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Records Found</div>
            <p className="empty-state-text">
              {filterLow
                ? 'Great news! No students currently fall below the 75% compliance threshold.'
                : 'No student attendance records matched your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Attended / Sessions</th>
                  <th style={{ width: '220px' }}>Attendance Rate</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>History</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const isLow = item.percentage < 75;
                  const isHigh = item.percentage >= 90;

                  return (
                    <tr key={item._id || item.rollNumber}>
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
                          {item.rollNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.email}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                        }}>
                          {item.department}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        {item.attended} / {item.totalClasses} classes
                      </td>
                      <td>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            <span style={{ color: isLow ? '#e11d48' : isHigh ? '#059669' : '#d97706' }}>
                              {item.percentage}%
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {isLow ? 'Deficit' : 'Target Met'}
                            </span>
                          </div>
                          <div style={{
                            height: '7px',
                            background: '#f1f5f9',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${Math.min(100, item.percentage)}%`,
                              height: '100%',
                              backgroundColor: isLow ? '#e11d48' : isHigh ? '#059669' : '#f59e0b',
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-absent' : isHigh ? 'badge-present' : 'badge-late'}`}>
                          {isLow ? 'At Risk (<75%)' : isHigh ? 'Excellent' : 'Satisfactory'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openStudentHistory(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.775rem' }}
                        >
                          👁️ View Log
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Student History Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedStudent.name}</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Roll: {selectedStudent.rollNumber} • {selectedStudent.department}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>
                &times;
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
                <div className="spinner"></div>
              </div>
            ) : !studentHistory || !studentHistory.history || studentHistory.history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                No recorded attendance sessions found for this student.
              </div>
            ) : (
              <div>
                {/* Stats Summary Pill */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Sessions</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{studentHistory.totalDays}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Present</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{studentHistory.presentCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 600 }}>Absent</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e11d48' }}>{studentHistory.absentCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#4338ca', fontWeight: 600 }}>Compliance Rate</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>{studentHistory.rate}%</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                  Session-by-Session Breakdown
                </h4>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {studentHistory.history.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                          📅 {log.date}
                        </div>
                        {log.remarks && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Note: "{log.remarks}"
                          </div>
                        )}
                      </div>
                      <span className={`badge ${log.status === 'Present' ? 'badge-present' : log.status === 'Late' ? 'badge-late' : 'badge-absent'}`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
