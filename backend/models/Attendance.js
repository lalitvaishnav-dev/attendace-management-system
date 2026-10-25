import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late'],
    default: 'Present',
    required: true,
  },
  remarks: {
    type: String,
    default: '',
    trim: true,
  },
});

const attendanceSchema = new mongoose.Schema(
  {
    date: {
      type: String, // Stored as YYYY-MM-DD for easy querying
      required: [true, 'Date is required'],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    records: [attendanceRecordSchema],
    markedBy: {
      type: String,
      default: 'Admin/Teacher',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for the same department and date
attendanceSchema.index({ date: 1, department: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
