// In-memory data store for fallback mode when MongoDB is offline / whitelisting pending

const initialStudents = [
  {
    _id: '6628b0f1a1b2c3d4e5f60001',
    rollNumber: 'CS2024-001',
    name: 'Aarav Sharma',
    email: 'aarav@edutrack.edu',
    department: 'Computer Science',
    year: '3rd Year',
    contactNumber: '+91 98765 43210',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6628b0f1a1b2c3d4e5f60002',
    rollNumber: 'CS2024-002',
    name: 'Diya Patel',
    email: 'diya@edutrack.edu',
    department: 'Computer Science',
    year: '3rd Year',
    contactNumber: '+91 98765 43211',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6628b0f1a1b2c3d4e5f60003',
    rollNumber: 'IT2024-010',
    name: 'Rohan Gupta',
    email: 'rohan@edutrack.edu',
    department: 'Information Technology',
    year: '2nd Year',
    contactNumber: '+91 98765 43212',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6628b0f1a1b2c3d4e5f60004',
    rollNumber: 'EC2024-025',
    name: 'Ananya Verma',
    email: 'ananya@edutrack.edu',
    department: 'Electronics',
    year: '4th Year',
    contactNumber: '+91 98765 43213',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6628b0f1a1b2c3d4e5f60005',
    rollNumber: 'CS2024-005',
    name: 'Vikram Singh',
    email: 'vikram@edutrack.edu',
    department: 'Computer Science',
    year: '3rd Year',
    contactNumber: '+91 98765 43214',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6628b0f1a1b2c3d4e5f60006',
    rollNumber: 'ME2024-012',
    name: 'Pooja Iyer',
    email: 'pooja@edutrack.edu',
    department: 'Mechanical',
    year: '2nd Year',
    contactNumber: '+91 98765 43215',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6628b0f1a1b2c3d4e5f60007',
    rollNumber: 'CE2024-018',
    name: 'Arjun Mehta',
    email: 'arjun@edutrack.edu',
    department: 'Civil',
    year: '3rd Year',
    contactNumber: '+91 98765 43216',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let studentsList = [...initialStudents];

const today = new Date().toISOString().split('T')[0];

let attendanceList = [
  {
    _id: 'att-6628b0f1001',
    date: today,
    department: 'Computer Science',
    markedBy: 'Admin/Teacher',
    records: [
      {
        student: {
          _id: '6628b0f1a1b2c3d4e5f60001',
          name: 'Aarav Sharma',
          rollNumber: 'CS2024-001',
          email: 'aarav@edutrack.edu',
          department: 'Computer Science',
        },
        status: 'Present',
        remarks: 'On time',
      },
      {
        student: {
          _id: '6628b0f1a1b2c3d4e5f60002',
          name: 'Diya Patel',
          rollNumber: 'CS2024-002',
          email: 'diya@edutrack.edu',
          department: 'Computer Science',
        },
        status: 'Present',
        remarks: '',
      },
      {
        student: {
          _id: '6628b0f1a1b2c3d4e5f60005',
          name: 'Vikram Singh',
          rollNumber: 'CS2024-005',
          email: 'vikram@edutrack.edu',
          department: 'Computer Science',
        },
        status: 'Late',
        remarks: 'Delayed by 10 mins',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const memoryStore = {
  // Student operations
  getStudents({ department, search }) {
    let result = studentsList.filter((s) => s.isActive);

    if (department && department !== 'All') {
      result = result.filter(
        (s) => s.department && s.department.toLowerCase() === department.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
  },

  getStudentById(id) {
    return studentsList.find((s) => s._id === id || s.rollNumber === id);
  },

  getStudentByRollNumber(rollNumber) {
    return studentsList.find(
      (s) => s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    );
  },

  addStudent(studentData) {
    const newStudent = {
      _id: 'mem-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...studentData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    studentsList.push(newStudent);
    return newStudent;
  },

  updateStudent(id, updateData) {
    const index = studentsList.findIndex((s) => s._id === id || s.rollNumber === id);
    if (index === -1) return null;

    studentsList[index] = {
      ...studentsList[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    return studentsList[index];
  },

  deleteStudent(id) {
    const index = studentsList.findIndex((s) => s._id === id || s.rollNumber === id);
    if (index === -1) return false;

    studentsList.splice(index, 1);
    return true;
  },

  // Attendance operations
  saveAttendance({ date, department, records, markedBy }) {
    // Populate records with student details if needed
    const populatedRecords = records.map((r) => {
      let studentObj = r.student;
      if (typeof studentObj === 'string') {
        const found = studentsList.find((s) => s._id === studentObj || s.rollNumber === studentObj);
        studentObj = found
          ? {
              _id: found._id,
              name: found.name,
              rollNumber: found.rollNumber,
              email: found.email,
              department: found.department,
            }
          : { _id: r.student, name: 'Student', rollNumber: r.student };
      }
      return {
        student: studentObj,
        status: r.status || 'Present',
        remarks: r.remarks || '',
      };
    });

    const existingIndex = attendanceList.findIndex(
      (a) => a.date === date && a.department.toLowerCase() === department.toLowerCase()
    );

    const doc = {
      _id: existingIndex >= 0 ? attendanceList[existingIndex]._id : 'att-' + Date.now(),
      date,
      department,
      records: populatedRecords,
      markedBy: markedBy || 'Admin/Teacher',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      attendanceList[existingIndex] = doc;
    } else {
      doc.createdAt = new Date().toISOString();
      attendanceList.push(doc);
    }

    return doc;
  },

  getAttendance({ date, department }) {
    let result = [...attendanceList];

    if (date) {
      result = result.filter((a) => a.date === date);
    }
    if (department && department !== 'All') {
      result = result.filter(
        (a) => a.department.toLowerCase() === department.toLowerCase()
      );
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  },

  getSummary() {
    const activeStudents = studentsList.filter((s) => s.isActive);
    const totalStudents = activeStudents.length;

    const todayString = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceList.filter((a) => a.date === todayString);

    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;

    todayRecords.forEach((att) => {
      att.records.forEach((rec) => {
        if (rec.status === 'Present') presentToday++;
        else if (rec.status === 'Absent') absentToday++;
        else if (rec.status === 'Late') lateToday++;
      });
    });

    const totalMarked = presentToday + absentToday + lateToday;
    const attendancePercentage =
      totalMarked > 0 ? Math.round(((presentToday + lateToday) / totalMarked) * 100) : 0;

    return {
      date: todayString,
      totalStudents,
      totalMarkedToday: totalMarked,
      presentToday,
      absentToday,
      lateToday,
      attendancePercentage,
    };
  },

  getStudentHistory(studentId) {
    const history = [];
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    attendanceList.forEach((att) => {
      const record = att.records.find((r) => {
        const sid = r.student?._id || r.student;
        return sid && sid.toString() === studentId.toString();
      });

      if (record) {
        if (record.status === 'Present') presentCount++;
        else if (record.status === 'Absent') absentCount++;
        else if (record.status === 'Late') lateCount++;

        history.push({
          date: att.date,
          department: att.department,
          status: record.status,
          remarks: record.remarks,
        });
      }
    });

    const totalDays = history.length;
    const rate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0;

    return {
      studentId,
      totalDays,
      presentCount,
      absentCount,
      lateCount,
      rate,
      history,
    };
  },

  getReports({ department }) {
    let list = studentsList.filter((s) => s.isActive);
    if (department && department !== 'All') {
      list = list.filter((s) => s.department && s.department.toLowerCase() === department.toLowerCase());
    }

    return list.map((student) => {
      let totalClasses = 0;
      let attended = 0;

      attendanceList.forEach((att) => {
        if (!department || department === 'All' || att.department.toLowerCase() === student.department.toLowerCase()) {
          const rec = att.records.find((r) => {
            const sid = r.student?._id || r.student;
            return sid && sid.toString() === student._id.toString();
          });
          if (rec) {
            totalClasses++;
            if (rec.status === 'Present' || rec.status === 'Late') {
              attended++;
            }
          }
        }
      });

      const percentage = totalClasses > 0 ? Number(((attended / totalClasses) * 100).toFixed(1)) : 100;
      return {
        _id: student._id,
        rollNumber: student.rollNumber,
        name: student.name,
        department: student.department,
        year: student.year,
        email: student.email,
        totalClasses,
        attended,
        percentage,
      };
    });
  },

  getDepartments() {
    const depts = new Set(['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil']);
    studentsList.forEach((s) => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts);
  },

  getAllInitialStudents() {
    return initialStudents.map(({ _id, createdAt, updatedAt, ...rest }) => rest);
  },
};
