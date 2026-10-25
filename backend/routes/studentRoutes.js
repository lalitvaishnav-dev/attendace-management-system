import express from 'express';
import mongoose from 'mongoose';
import Student from '../models/Student.js';
import { memoryStore } from '../data/memoryStore.js';

const router = express.Router();

// Helper to determine if live MongoDB is ready
const isDbConnected = () => mongoose.connection.readyState === 1;

// GET /api/students/departments - Get distinct list of departments
router.get('/departments', async (req, res) => {
  try {
    const defaults = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'];
    if (isDbConnected()) {
      const distinct = await Student.distinct('department', { isActive: true });
      const combined = Array.from(new Set([...defaults, ...distinct])).filter(Boolean);
      return res.json({ success: true, data: combined });
    }
    const memDepts = memoryStore.getDepartments();
    res.json({ success: true, data: memDepts });
  } catch {
    res.json({ success: true, data: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'] });
  }
});

// GET /api/students - List all students (optional filter by department & search)
router.get('/', async (req, res) => {
  try {
    const { department, search } = req.query;

    if (isDbConnected()) {
      const query = { isActive: true };

      if (department && department !== 'All') {
        query.department = department;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const students = await Student.find(query).sort({ rollNumber: 1 });
      return res.json({
        success: true,
        count: students.length,
        data: students,
        database: 'connected',
      });
    }

    // Offline / memory fallback
    const memoryStudents = memoryStore.getStudents({ department, search });
    return res.json({
      success: true,
      count: memoryStudents.length,
      data: memoryStudents,
      database: 'memory-fallback',
      message: 'Running in resilient in-memory mode while MongoDB Atlas connects.',
    });
  } catch (error) {
    // Graceful fallback to memory store if any DB error occurred
    const fallbackStudents = memoryStore.getStudents(req.query);
    res.json({
      success: true,
      count: fallbackStudents.length,
      data: fallbackStudents,
      database: 'memory-fallback',
      warning: error.message,
    });
  }
});

// GET /api/students/:id - Get single student by ID or roll number
router.get('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const student = await Student.findById(req.params.id);
      if (student) {
        return res.json({ success: true, data: student, database: 'connected' });
      }
    }

    const memoryStudent = memoryStore.getStudentById(req.params.id);
    if (!memoryStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: memoryStudent, database: isDbConnected() ? 'connected' : 'memory-fallback' });
  } catch {
    const memoryStudent = memoryStore.getStudentById(req.params.id);
    if (memoryStudent) {
      return res.json({ success: true, data: memoryStudent, database: 'memory-fallback' });
    }
    res.status(404).json({ success: false, message: 'Student not found' });
  }
});

// POST /api/students - Add a new student
router.post('/', async (req, res) => {
  try {
    const { rollNumber, name, email, department, year, contactNumber } = req.body;

    if (!rollNumber || !name || !email || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (rollNumber, name, email, department, year)',
      });
    }

    if (isDbConnected()) {
      const existingStudent = await Student.findOne({ rollNumber });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: `Student with roll number ${rollNumber} already exists`,
        });
      }

      const student = new Student({
        rollNumber,
        name,
        email,
        department,
        year,
        contactNumber,
      });

      const savedStudent = await student.save();
      // Keep memory store in sync
      memoryStore.addStudent(savedStudent.toObject());

      return res.status(201).json({ success: true, data: savedStudent, database: 'connected' });
    }

    // Memory store mode
    const existing = memoryStore.getStudentByRollNumber(rollNumber);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number ${rollNumber} already exists`,
      });
    }

    const saved = memoryStore.addStudent({
      rollNumber,
      name,
      email,
      department,
      year,
      contactNumber,
    });

    res.status(201).json({ success: true, data: saved, database: 'memory-fallback' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/students/:id - Update student details
router.put('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const updatedStudent = await Student.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (updatedStudent) {
        memoryStore.updateStudent(req.params.id, updatedStudent.toObject());
        return res.json({ success: true, data: updatedStudent, database: 'connected' });
      }
    }

    const updated = memoryStore.updateStudent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: updated, database: 'memory-fallback' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/students/:id - Remove a student
router.delete('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const deletedStudent = await Student.findByIdAndDelete(req.params.id);
      if (deletedStudent) {
        memoryStore.deleteStudent(req.params.id);
        return res.json({ success: true, message: 'Student deleted successfully' });
      }
    }

    const deleted = memoryStore.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, message: 'Student deleted successfully (in-memory)' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
