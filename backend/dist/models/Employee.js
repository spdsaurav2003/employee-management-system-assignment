"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Counter_1 = __importDefault(require("./Counter"));
const EmployeeSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true
});
// Pre-save hook to auto-generate Employee ID
EmployeeSchema.pre('save', async function (next) {
    if (this.isNew && !this.employeeId) {
        try {
            const counter = await Counter_1.default.findOneAndUpdate({ id: 'employeeId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
            const seqStr = String(counter.seq).padStart(4, '0');
            this.employeeId = `EMP-${seqStr}`;
            next();
        }
        catch (err) {
            next(err);
        }
    }
    else {
        next();
    }
});
// Pre-save hook to hash password
EmployeeSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password)
        return next();
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        this.password = await bcryptjs_1.default.hash(this.password, salt);
        next();
    }
    catch (err) {
        next(err);
    }
});
// Password verification helper method
EmployeeSchema.methods.comparePassword = async function (password) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(password, this.password);
};
exports.default = mongoose_1.default.model('Employee', EmployeeSchema);
