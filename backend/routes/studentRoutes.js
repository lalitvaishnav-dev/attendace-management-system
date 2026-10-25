import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();

// GET /api/students - List all students (optional filter by department)
router.get('/', async (req, res) => {
  try {
    const { department, search } = req.query;
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
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/students/:id - Get single student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/students - Add a new student
router.post('/', async (req, res) => {
  try {
    const { rollNumber, name, email, department, year, contactNumber } = req.body;

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
    res.status(201).json({ success: true, data: savedStudent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/students/:id - Update student details
router.put('/:id', async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/students/:id - Remove a student
router.delete('/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
