import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import Counter from './Counter';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  reportingManager: mongoose.Types.ObjectId | null;
  profileImage: string;
  isDeleted: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeId: {
      type: String,
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Exclude password from query results by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary must be a positive number']
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Inactive'],
        message: 'Status must be Active or Inactive'
      },
      default: 'Active'
    },
    role: {
      type: String,
      enum: {
        values: ['Super Admin', 'HR Manager', 'Employee'],
        message: 'Role must be Super Admin, HR Manager, or Employee'
      },
      default: 'Employee'
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    profileImage: {
      type: String,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to auto-generate Employee ID
EmployeeSchema.pre<IEmployee>('save', async function (next) {
  if (this.isNew && !this.employeeId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { id: 'employeeId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const seqStr = String(counter.seq).padStart(4, '0');
      this.employeeId = `EMP-${seqStr}`;
      next();
    } catch (err: any) {
      next(err);
    }
  } else {
    next();
  }
});

// Pre-save hook to hash password
EmployeeSchema.pre<IEmployee>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Password verification helper method
EmployeeSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
