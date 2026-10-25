import React, { useState } from 'react';

const sampleReports = [
  { rollNumber: 'CS2024-001', name: 'Aarav Sharma', department: 'Computer Science', totalClasses: 40, attended: 38, percentage: 95 },
  { rollNumber: 'CS2024-002', name: 'Diya Patel', department: 'Computer Science', totalClasses: 40, attended: 37, percentage: 92.5 },
  { rollNumber: 'IT2024-010', name: 'Rohan Gupta', department: 'Information Technology', totalClasses: 38, attended: 33, percentage: 86.8 },
  { rollNumber: 'EC2024-025', name: 'Ananya Verma', department: 'Electronics', totalClasses: 42, attended: 30, percentage: 71.4 },
  { rollNumber: 'CS2024-005', name: 'Vikram Singh', department: 'Computer Science', totalClasses: 40, attended: 28, percentage: 70.0 },
];

const Reports = () => {
  const [department, setDepartment] = useState('All');
  const [filterLow, setFilterLow] = useState(false);

  const filteredData = sampleReports.filter((item) => {
    const matchesDept = department === 'All' || item.department === department;
    const matchesLow = filterLow ? item.percentage < 75 : true;
    return matchesDept && matchesLow;
  });

  const handleExportCSV = () => {
    const headers = 'Roll Number,Name,Department,Total Classes,Attended Classes,Percentage\n';
    const rows = filteredData
      .map((r) => `${r.rollNumber},"${r.name}","${r.department}",${r.totalClasses},${r.attended},${r.percentage}%`)
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${Date.now()}.csv`);
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">Analyze attendance percentages, student compliance, and export records</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-primary">
          📥 Export to CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-card stat-card">
          <div>
            <div className="stat-title">Average Attendance</div>
            <div className="stat-value">{averagePercentage}%</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', fontSize: '1.4rem' }}>
            📊
          </div>
        </div>

        <div className="glass-card stat-card">
          <div>
            <div className="stat-title">Students Evaluated</div>
            <div className="stat-value">{filteredData.length}</div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', fontSize: '1.4rem' }}>
            👨‍🎓
          </div>
        </div>

        <div className="glass-card stat-card">
          <div>
            <div className="stat-title">Below 75% Attendance</div>
            <div className="stat-value" style={{ color: atRiskCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
              {atRiskCount}
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', fontSize: '1.4rem' }}>
            ⚠️
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '220px' }}>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filterLow}
                onChange={(e) => setFilterLow(e.target.checked)}
              />
              Show Only Low Attendance (&lt; 75%)
            </label>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {filteredData.length} student records
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card" style={{ padding: '0.5rem' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Department</th>
                <th>Attended / Total</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.rollNumber}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {row.rollNumber}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {row.department}
                  </td>
                  <td>
                    {row.attended} / {row.totalClasses}
                  </td>
                  <td style={{ width: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${row.percentage}%`,
                          height: '100%',
                          background: row.percentage >= 75 ? 'var(--success)' : 'var(--danger)',
                          borderRadius: '9999px',
                        }} />
                      </div>
                      <span style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: row.percentage >= 75 ? 'var(--success)' : 'var(--danger)',
                        minWidth: '45px',
                      }}>
                        {row.percentage}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {row.percentage >= 75 ? (
                      <span className="badge badge-present">Good Standing</span>
                    ) : (
                      <span className="badge badge-absent">Low Attendance</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
