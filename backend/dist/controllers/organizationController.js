"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportingManager = exports.getDirectReportees = exports.getOrganizationTree = void 0;
const Employee_1 = __importDefault(require("../models/Employee"));
const circularCheck_1 = require("../utils/circularCheck");
// GET /api/organization/tree - Returns the full nested reporting tree
const getOrganizationTree = async (req, res) => {
    try {
        // Retrieve all active, non-deleted employees
        const employees = await Employee_1.default.find({ isDeleted: false }).select('name email role designation department status profileImage reportingManager employeeId');
        // Create a dictionary of nodes mapped by their ID
        const nodeMap = new Map();
        const treeNodes = employees.map((emp) => {
            const node = {
                _id: emp._id.toString(),
                employeeId: emp.employeeId,
                name: emp.name,
                email: emp.email,
                role: emp.role,
                designation: emp.designation,
                department: emp.department,
                status: emp.status,
                profileImage: emp.profileImage,
                children: []
            };
            nodeMap.set(node._id, node);
            return node;
        });
        const roots = [];
        // Construct the nested structure in O(N)
        for (const node of treeNodes) {
            const dbEmp = employees.find((e) => e._id.toString() === node._id);
            const parentId = dbEmp?.reportingManager?.toString();
            if (parentId && nodeMap.has(parentId)) {
                // Add to parent's children
                nodeMap.get(parentId).children.push(node);
            }
            else {
                // If no parent or parent is not in the system, it's a root
                roots.push(node);
            }
        }
        return res.status(200).json(roots);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getOrganizationTree = getOrganizationTree;
// GET /api/employees/:id/reportees - Returns direct reports for a specific ID
const getDirectReportees = async (req, res) => {
    try {
        const managerId = req.params.id;
        // Verify manager exists
        const manager = await Employee_1.default.findOne({ _id: managerId, isDeleted: false });
        if (!manager) {
            return res.status(404).json({ message: 'Manager not found' });
        }
        const reportees = await Employee_1.default.find({ reportingManager: managerId, isDeleted: false })
            .select('name email role designation department status profileImage employeeId');
        return res.status(200).json(reportees);
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getDirectReportees = getDirectReportees;
// PATCH /api/employees/:id/manager - Updates the reporting manager
const updateReportingManager = async (req, res) => {
    const currentUser = req.user;
    const targetId = req.params.id;
    const { reportingManager } = req.body;
    if (!currentUser) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // HR Managers and Super Admins can update reporting managers
    if (currentUser.role !== 'Super Admin' && currentUser.role !== 'HR Manager') {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions to change reporting managers' });
    }
    try {
        const employee = await Employee_1.default.findById(targetId);
        if (!employee || employee.isDeleted) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        // Check circular reporting if setting a manager
        if (reportingManager) {
            // HR Managers cannot modify Super Admin managers or change them
            if (currentUser.role === 'HR Manager' && employee.role === 'Super Admin') {
                return res.status(403).json({ message: 'Forbidden: HR Managers cannot modify Super Admins' });
            }
            const isCircular = await (0, circularCheck_1.isCircularReporting)(targetId, reportingManager);
            if (isCircular) {
                return res.status(400).json({
                    message: 'Circular reporting detected. Assigning this manager would create a circular dependency loop.'
                });
            }
            // Verify the new manager exists and is active
            const manager = await Employee_1.default.findById(reportingManager);
            if (!manager || manager.isDeleted) {
                return res.status(400).json({ message: 'Proposed reporting manager not found' });
            }
        }
        employee.reportingManager = reportingManager ? reportingManager : null;
        await employee.save();
        const updated = employee.toObject();
        delete updated.password;
        return res.status(200).json({
            message: 'Reporting manager updated successfully',
            employee: updated
        });
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.updateReportingManager = updateReportingManager;
