import React from 'react';

const StudentTable = ({ students = [], onDelete, onEdit }) => {
  if (!students || students.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <div className="empty-state-title">No Students Found</div>
        <p className="empty-state-text">
          No student records match your query or department filter. Add a student to populate the directory.
        </p>
      </div>
    );
  }

  // Helper for avatar initials and colors
  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getAvatarBg = (name) => {
    const colors = [
      { bg: '#eef2ff', text: '#4338ca' },
      { bg: '#ecfdf5', text: '#047857' },
      { bg: '#eff6ff', text: '#1d4ed8' },
      { bg: '#fdf2f8', text: '#be185d' },
      { bg: '#fef3c7', text: '#b45309' },
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Roll Number</th>
            <th>Department</th>
            <th>Academic Year</th>
            <th>Contact</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const avatarStyle = getAvatarBg(student.name);

            return (
              <tr key={student._id || student.rollNumber}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: avatarStyle.bg,
                        color: avatarStyle.text,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {student.email}
                      </div>
                    </div>
                  </div>
                </td>
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
                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                  }}>
                    {student.department}
                  </span>
                </td>
                <td style={{ color: '#475569', fontWeight: 500, fontSize: '0.85rem' }}>
                  {student.year}
                </td>
                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {student.contactNumber || '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(student)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Student"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(student._id || student.rollNumber)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.65rem', color: '#e11d48', borderColor: '#fecdd3' }}
                        title="Delete Student"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
