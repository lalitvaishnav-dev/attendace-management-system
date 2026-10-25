import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0,
    totalMarkedToday: 0,
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, studentsRes, attendanceRes] = await Promise.all([
        fetch('/api/attendance/summary').then((r) => r.json()).catch(() => ({})),
        fetch('/api/students').then((r) => r.json()).catch(() => ({})),
        fetch('/api/attendance').then((r) => r.json()).catch(() => ({})),
      ]);

      const studentsList = studentsRes.data || [];
      const attendanceList = attendanceRes.data || [];
      const today = new Date().toISOString().split('T')[0];

      // Update KPI stats
      if (summaryRes.success && summaryRes.data) {
        setStats({
          totalStudents: summaryRes.data.totalStudents || studentsList.length,
          presentToday: summaryRes.data.presentToday || 0,
          absentToday: summaryRes.data.absentToday || 0,
          lateToday: summaryRes.data.lateToday || 0,
          attendanceRate: summaryRes.data.attendancePercentage || 0,
          totalMarkedToday: summaryRes.data.totalMarkedToday || 0,
        });
      } else {
        setStats({
          totalStudents: studentsList.length,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          attendanceRate: 0,
          totalMarkedToday: 0,
        });
      }

      // Compute Dynamic Department Breakdown
      const deptsMap = {};
      studentsList.forEach((s) => {
        const d = s.department || 'General';
        if (!deptsMap[d]) {
          deptsMap[d] = { total: 0, presentToday: 0, markedToday: 0 };
        }
        deptsMap[d].total += 1;
      });

      // Today's attendance by department
      const todayAttendances = attendanceList.filter((a) => a.date === today);
      todayAttendances.forEach((att) => {
        const d = att.department;
        if (!deptsMap[d]) {
          deptsMap[d] = { total: 0, presentToday: 0, markedToday: 0 };
        }
        att.records.forEach((rec) => {
          deptsMap[d].markedToday += 1;
          if (rec.status === 'Present' || rec.status === 'Late') {
            deptsMap[d].presentToday += 1;
          }
        });
      });

      const deptsArray = Object.keys(deptsMap).map((deptName) => {
        const info = deptsMap[deptName];
        const rate = info.markedToday > 0 ? Math.round((info.presentToday / info.markedToday) * 100) : 0;
        return {
          dept: deptName,
          total: info.total,
          markedToday: info.markedToday,
          presentToday: info.presentToday,
          rate,
        };
      });

      setDepartmentStats(deptsArray);

      // Recent attendance sessions
      setRecentSessions(attendanceList.slice(0, 5));
    } catch {
      // In case of error, defaults remain 0
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Enrolled Students',
      value: stats.totalStudents,
      sub: 'Active profiles',
      icon: '👥',
      color: '#4f46e5',
      bg: '#eef2ff',
      borderColor: '#c7d2fe',
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      sub: `${stats.totalMarkedToday} marked today`,
      icon: '✅',
      color: '#059669',
      bg: '#ecfdf5',
      borderColor: '#a7f3d0',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      sub: stats.absentToday > 0 ? 'Requires attention' : 'No absences',
      icon: '❌',
      color: '#e11d48',
      bg: '#fff1f2',
      borderColor: '#fecdd3',
    },
    {
      title: 'Today Rate',
      value: `${stats.attendanceRate}%`,
      sub: stats.totalMarkedToday > 0 ? 'Live computed' : 'No attendance yet',
      icon: '📈',
      color: '#d97706',
      bg: '#fffbeb',
      borderColor: '#fde68a',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Real-time attendance intelligence and campus analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/mark-attendance')}
            className="btn btn-primary"
          >
            ✏️ Mark Attendance
          </button>
          <button
            onClick={() => navigate('/students')}
            className="btn btn-secondary"
          >
            + Add Student
          </button>
          <button
            onClick={loadDashboardData}
            title="Refresh live data"
            className="btn btn-secondary"
            style={{ padding: '0.65rem 0.85rem' }}
          >
            🔄
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="stat-card">
            <div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-value">{loading ? '...' : card.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>
                {card.sub}
              </div>
            </div>
            <div
              className="stat-icon"
              style={{
                backgroundColor: card.bg,
                border: `1px solid ${card.borderColor}`,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Department Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Department Attendance Overview */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Department Enrollment & Turnout
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Live student count and today's attendance rate</p>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
              {departmentStats.length} Depts
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          ) : departmentStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              No departments registered yet. Add students to see breakdown.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {departmentStats.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.dept}</span>
                    <span style={{ fontWeight: 600, color: item.markedToday > 0 ? '#059669' : '#64748b' }}>
                      {item.markedToday > 0 ? `${item.rate}% (${item.presentToday}/${item.markedToday} today)` : `${item.total} Enrolled`}
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${item.markedToday > 0 ? item.rate : Math.min(100, item.total * 20)}%`,
                      height: '100%',
                      background: item.markedToday > 0
                        ? 'linear-gradient(90deg, #4f46e5 0%, #10b981 100%)'
                        : '#cbd5e1',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations & Live Session Log */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Recent Attendance Sessions
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest sessions recorded in database</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              View Full Reports →
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          ) : recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>No Attendance Marked Yet</div>
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1rem' }}>Start recording daily student attendance for your classes.</p>
              <button
                onClick={() => navigate('/mark-attendance')}
                className="btn btn-primary btn-sm"
              >
                Mark First Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentSessions.map((session, idx) => {
                const presentCount = session.records?.filter((r) => r.status === 'Present').length || 0;
                const totalInSession = session.records?.length || 0;
                const pct = totalInSession > 0 ? Math.round((presentCount / totalInSession) * 100) : 0;

                return (
                  <div
                    key={session._id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                        {session.department}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        📅 {session.date} • Marked by {session.markedBy || 'Admin'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '0.825rem', 
                        fontWeight: 700, 
                        color: pct >= 75 ? '#059669' : '#e11d48' 
                      }}>
                        {presentCount}/{totalInSession} Present
                      </div>
                      <span className={`badge ${pct >= 75 ? 'badge-present' : 'badge-absent'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        {pct}% Turnout
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
