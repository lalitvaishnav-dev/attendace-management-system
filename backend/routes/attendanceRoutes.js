import express from 'express';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

const router = express.Router();

// POST /api/attendance - Mark or update attendance for date and department
router.post('/', async (req, res) => {
  try {
    const { date, department, records, markedBy } = req.body;

    if (!date || !department || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, department, and records array',
      });
    }

    // Upsert attendance for date & department
    const updatedAttendance = await Attendance.findOneAndUpdate(
      { date, department },
      {
        date,
        department,
        records,
        markedBy: markedBy || 'Admin/Teacher',
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('records.student', 'name rollNumber email department');

    res.status(200).json({
      success: true,
      message: 'Attendance saved successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/attendance - Fetch attendance by date and/or department
router.get('/', async (req, res) => {
  try {
    const { date, department } = req.query;
    const query = {};

    if (date) query.date = date;
    if (department && department !== 'All') query.department = department;

    const attendances = await Attendance.find(query)
      .populate('records.student', 'name rollNumber email department')
      .sort({ date: -1 });

    res.json({ success: true, count: attendances.length, data: attendances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/attendance/summary - Dashboard metrics (counts & rates)
router.get('/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStudents = await Student.countDocuments({ isActive: true });

    const todayAttendance = await Attendance.find({ date: today });

    let presentToday = 0;
    let absentToday = 0;
    let lateToday = 0;

    todayAttendance.forEach((att) => {
      att.records.forEach((rec) => {
        if (rec.status === 'Present') presentToday++;
        else if (rec.status === 'Absent') absentToday++;
        else if (rec.status === 'Late') lateToday++;
      });
    });

    const totalMarked = presentToday + absentToday + lateToday;
    const attendancePercentage = totalMarked > 0
      ? Math.round(((presentToday + lateToday) / totalMarked) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        date: today,
        totalStudents,
        totalMarkedToday: totalMarked,
        presentToday,
        absentToday,
        lateToday,
        attendancePercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/attendance/student/:id - History for a specific student
router.get('/student/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const attendances = await Attendance.find({
      'records.student': studentId,
    }).sort({ date: -1 });

    const history = [];
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    attendances.forEach((att) => {
      const record = att.records.find(
        (r) => r.student && r.student.toString() === studentId
      );
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

    res.json({
      success: true,
      data: {
        studentId,
        totalDays,
        presentCount,
        absentCount,
        lateCount,
        rate,
        history,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
