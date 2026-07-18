"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Counter_1 = __importDefault(require("../models/Counter"));
const dns_1 = __importDefault(require("dns"));
dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
dotenv_1.default.config();
const seed = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems';
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB for seeding...');
        // Clear existing data
        await Employee_1.default.deleteMany({});
        await Counter_1.default.deleteMany({});
        console.log('Cleared existing employees and counters...');
        // Initialize Employee counter
        const empCounter = new Counter_1.default({ id: 'employeeId', seq: 0 });
        await empCounter.save();
        // 1. Create Super Admin
        const admin = new Employee_1.default({
            name: 'Super Admin',
            email: 'admin@ems.com',
            password: 'Password123', // Will be hashed via pre-save hook
            phone: '1234567890',
            department: 'Management',
            designation: 'CEO',
            salary: 150000,
            joiningDate: new Date('2024-01-01'),
            status: 'Active',
            role: 'Super Admin',
            reportingManager: null,
            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        await admin.save();
        console.log(`Created Super Admin: ${admin.email} (Password: Password123)`);
        // 2. Create HR Manager reporting to Admin
        const hr = new Employee_1.default({
            name: 'Sarah Jenkins',
            email: 'hr@ems.com',
            password: 'Password123',
            phone: '2345678901',
            department: 'Human Resources',
            designation: 'HR Manager',
            salary: 85000,
            joiningDate: new Date('2024-02-15'),
            status: 'Active',
            role: 'HR Manager',
            reportingManager: admin._id,
            profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        await hr.save();
        console.log(`Created HR Manager: ${hr.email} (Password: Password123)`);
        // 3. Create regular Employees reporting to HR Manager
        const dev1 = new Employee_1.default({
            name: 'John Doe',
            email: 'john.doe@ems.com',
            password: 'Password123',
            phone: '3456789012',
            department: 'Engineering',
            designation: 'Senior Software Engineer',
            salary: 95000,
            joiningDate: new Date('2024-03-01'),
            status: 'Active',
            role: 'Employee',
            reportingManager: hr._id,
            profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        await dev1.save();
        const dev2 = new Employee_1.default({
            name: 'Jane Smith',
            email: 'jane.smith@ems.com',
            password: 'Password123',
            phone: '4567890123',
            department: 'Engineering',
            designation: 'Frontend Engineer',
            salary: 75000,
            joiningDate: new Date('2024-04-10'),
            status: 'Active',
            role: 'Employee',
            reportingManager: dev1._id, // Jane reports to John
            profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        await dev2.save();
        const designer = new Employee_1.default({
            name: 'Alice Cooper',
            email: 'alice@ems.com',
            password: 'Password123',
            phone: '5678901234',
            department: 'Design',
            designation: 'UI/UX Designer',
            salary: 80000,
            joiningDate: new Date('2024-03-20'),
            status: 'Active',
            role: 'Employee',
            reportingManager: hr._id, // Alice reports to Sarah (HR)
            profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        await designer.save();
        console.log('Database seeded successfully with initial organizational tree!');
        console.log(`Reporting Hierarchy:
- ${admin.name} (${admin.role})
  └── ${hr.name} (${hr.role})
      ├── ${dev1.name} (Employee)
      │   └── ${dev2.name} (Employee)
      └── ${designer.name} (Employee)
`);
        await mongoose_1.default.connection.close();
    }
    catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};
seed();
