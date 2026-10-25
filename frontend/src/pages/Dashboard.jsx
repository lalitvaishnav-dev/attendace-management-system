import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 120,
    presentToday: 108,
    absentToday: 9,
    lateToday: 3,
    attendanceRate: 92,
  });

  // Try fetching live summary from backend if running
  useEffect(() => {
    fetch('/api/attendance/summary')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.totalStudents > 0) {
          setStats({
            totalStudents: data.data.totalStudents,
            presentToday: data.data.presentToday,
            absentToday: data.data.absentToday,
            lateToday: data.data.lateToday,
            attendanceRate: data.data.attendancePercentage,
          });
        }
      })
      .catch(() => {
        // Fallback to sample demo statistics
      });
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: '👥',
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.15)',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: '✅',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: '❌',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: '📈',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time attendance tracking and student management</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/mark-attendance')}
            className="btn btn-primary"
          >
            ✏️ Mark Today's Attendance
          </button>
          <button
            onClick={() => navigate('/students')}
            className="btn btn-secondary"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="glass-card stat-card">
            <div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-value">{card.value}</div>
            </div>
            <div
              className="stat-icon"
              style={{ backgroundColor: card.bg, fontSize: '1.4rem' }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Department Attendance Overview */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Department Turnout
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { dept: 'Computer Science & Engineering', rate: 95, count: '48 / 50' },
              { dept: 'Information Technology', rate: 90, count: '36 / 40' },
              { dept: 'Electronics & Communication', rate: 85, count: '25 / 30' },
            ].map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>{item.dept}</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.rate}% ({item.count})</span>
                </div>
                <div style={{
                  height: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${item.rate}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                    borderRadius: '9999px',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Recent Notices */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              onClick={() => navigate('/reports')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>📊 Attendance Reports</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generate daily, weekly, or semester reports</div>
              </div>
              <span style={{ color: 'var(--primary)' }}>→</span>
            </div>

            <div
              onClick={() => navigate('/students')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>👥 Student Directory</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage student profiles and enrollment</div>
              </div>
              <span style={{ color: 'var(--primary)' }}>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
