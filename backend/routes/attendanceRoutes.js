import express from 'express';
import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { memoryStore } from '../data/memoryStore.js';

const router = express.Router();

const isDbConnected = () => mongoose.connection.readyState === 1;

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

    if (isDbConnected()) {
      // Upsert attendance for date & department in MongoDB
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

      // Keep memory store in sync
      memoryStore.saveAttendance({ date, department, records, markedBy });

      return res.status(200).json({
        success: true,
        message: 'Attendance saved successfully',
        data: updatedAttendance,
        database: 'connected',
      });
    }

    // Memory fallback
    const saved = memoryStore.saveAttendance({ date, department, records, markedBy });
    res.status(200).json({
      success: true,
      message: 'Attendance saved in memory store',
      data: saved,
      database: 'memory-fallback',
    });
  } catch (error) {
    // Fallback to memory store if Mongo threw an error
    try {
      const { date, department, records, markedBy } = req.body;
      const saved = memoryStore.saveAttendance({ date, department, records, markedBy });
      return res.status(200).json({
        success: true,
        message: 'Attendance saved in fallback memory',
        data: saved,
        database: 'memory-fallback',
      });
    } catch (e) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
});

// GET /api/attendance - Fetch attendance by date and/or department
router.get('/', async (req, res) => {
  try {
    const { date, department } = req.query;

    if (isDbConnected()) {
      const query = {};
      if (date) query.date = date;
      if (department && department !== 'All') query.department = department;

      const attendances = await Attendance.find(query)
        .populate('records.student', 'name rollNumber email department')
        .sort({ date: -1 });

      return res.json({
        success: true,
        count: attendances.length,
        data: attendances,
        database: 'connected',
      });
    }

    const memoryAttendances = memoryStore.getAttendance({ date, department });
    res.json({
      success: true,
      count: memoryAttendances.length,
      data: memoryAttendances,
      database: 'memory-fallback',
    });
  } catch (error) {
    const memoryAttendances = memoryStore.getAttendance(req.query);
    res.json({
      success: true,
      count: memoryAttendances.length,
      data: memoryAttendances,
      database: 'memory-fallback',
      warning: error.message,
    });
  }
});

// GET /api/attendance/summary - Dashboard metrics (counts & rates)
router.get('/summary', async (req, res) => {
  try {
    if (isDbConnected()) {
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
      const attendancePercentage =
        totalMarked > 0 ? Math.round(((presentToday + lateToday) / totalMarked) * 100) : 0;

      return res.json({
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
        database: 'connected',
      });
    }

    const summary = memoryStore.getSummary();
    res.json({
      success: true,
      data: summary,
      database: 'memory-fallback',
    });
  } catch (error) {
    const summary = memoryStore.getSummary();
    res.json({
      success: true,
      data: summary,
      database: 'memory-fallback',
      warning: error.message,
    });
  }
});

// GET /api/attendance/student/:id - History for a specific student
router.get('/student/:id', async (req, res) => {
  try {
    const studentId = req.params.id;

    if (isDbConnected()) {
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

      return res.json({
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
        database: 'connected',
      });
    }

    const studentHistory = memoryStore.getStudentHistory(studentId);
    res.json({
      success: true,
      data: studentHistory,
      database: 'memory-fallback',
    });
  } catch (error) {
    const studentHistory = memoryStore.getStudentHistory(req.params.id);
    res.json({
      success: true,
      data: studentHistory,
      database: 'memory-fallback',
      warning: error.message,
    });
  }
});

// GET /api/attendance/reports - Full dynamic attendance report
router.get('/reports', async (req, res) => {
  try {
    const { department } = req.query;

    if (isDbConnected()) {
      const studentQuery = { isActive: true };
      if (department && department !== 'All') {
        studentQuery.department = department;
      }

      const students = await Student.find(studentQuery).sort({ rollNumber: 1 });
      const attendanceQuery = {};
      if (department && department !== 'All') {
        attendanceQuery.department = department;
      }

      const attendances = await Attendance.find(attendanceQuery);

      const reportData = students.map((student) => {
        let totalClasses = 0;
        let attended = 0;

        attendances.forEach((att) => {
          if (!department || department === 'All' || att.department === student.department) {
            const record = att.records.find(
              (r) => r.student && r.student.toString() === student._id.toString()
            );
            if (record) {
              totalClasses++;
              if (record.status === 'Present' || record.status === 'Late') {
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

      return res.json({
        success: true,
        count: reportData.length,
        data: reportData,
        database: 'connected',
      });
    }

    const memoryReports = memoryStore.getReports({ department });
    res.json({
      success: true,
      count: memoryReports.length,
      data: memoryReports,
      database: 'memory-fallback',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
