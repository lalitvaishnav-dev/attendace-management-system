import React from 'react';

const StudentTable = ({ students = [], onDelete, onEdit }) => {
  if (!students || students.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
        <p style={{ fontWeight: 500 }}>No students found</p>
        <p style={{ fontSize: '0.85rem' }}>Add a student to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id || student.rollNumber}>
              <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {student.rollNumber}
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {student.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {student.contactNumber || 'No phone'}
                </div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>
                {student.email}
              </td>
              <td>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  {student.department}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>
                {student.year}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(student)}
                      className="btn btn-secondary btn-sm"
                      title="Edit"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(student._id || student.rollNumber)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
