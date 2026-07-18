"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Employee_1 = __importDefault(require("../models/Employee"));
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        // Find employee and explicitly select password and isDeleted
        const employee = await Employee_1.default.findOne({ email: email.toLowerCase() }).select('+password');
        if (!employee || employee.isDeleted) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        if (employee.status === 'Inactive') {
            return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
        }
        const isMatch = await employee.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT
        const secret = process.env.JWT_SECRET || 'ems_super_secret_key_987654321_abc';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const token = jsonwebtoken_1.default.sign({
            id: employee._id,
            email: employee.email,
            role: employee.role
        }, secret, { expiresIn: expiresIn });
        return res.status(200).json({
            token,
            id: employee._id,
            employeeId: employee.employeeId,
            role: employee.role,
            name: employee.name,
            email: employee.email
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.login = login;
const logout = async (req, res) => {
    // Clear token logic for clients using cookies (optional but good practice)
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
};
exports.logout = logout;
