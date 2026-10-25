import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'

  useEffect(() => {
    const checkHealth = () => {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
        })
        .catch(() => {
          setDbStatus('disconnected');
        });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav style={{
      borderBottom: '1px solid #e2e8f0',
      background: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0.85rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo / Brand */}
        <div 
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.25rem',
            boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
          }}>
            🎓
          </div>
          <div>
            <div style={{ 
              fontWeight: 800, 
              fontSize: '1.15rem', 
              letterSpacing: '-0.025em', 
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              EduTrack
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                background: '#e0e7ff', 
                color: '#4338ca', 
                padding: '0.15rem 0.45rem', 
                borderRadius: '6px' 
              }}>
                PRO
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Attendance Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {[
            { label: 'Dashboard', path: '/' },
            { label: 'Mark Attendance', path: '/mark-attendance' },
            { label: 'Students', path: '/students' },
            { label: 'Reports', path: '/reports' },
          ].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#4338ca' : '#475569',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Status Indicator & Admin Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {dbStatus === 'connected' ? (
            <div
              title="MongoDB Atlas database is connected"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                color: '#047857',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
              Live DB
            </div>
          ) : (
            <div
              title="Running in resilient in-memory mode. Whitelist your IP in MongoDB Atlas to connect live cluster."
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.75rem',
                color: '#b45309',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                fontWeight: 600,
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
              Demo Mode
            </div>
          )}

          <NavLink
            to="/login"
            className="btn btn-secondary btn-sm"
            style={{ 
              borderRadius: '9999px', 
              padding: '0.45rem 1rem',
              fontWeight: 600,
              fontSize: '0.825rem'
            }}
          >
            Admin Portal
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
