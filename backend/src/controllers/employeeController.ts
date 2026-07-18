import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import Employee from '../models/Employee';
import { isCircularReporting } from '../utils/circularCheck';


// GET /api/employees - Paginated, searched, filtered, sorted employee list
export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const department = (req.query.department as string) || '';
    const role = (req.query.role as string) || '';
    const status = (req.query.status as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;

    // Build query filter
    const query: any = { isDeleted: false };

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (department) query.department = department;
    if (role) query.role = role;
    if (status) query.status = status;

    // Sorting
    const sort: any = {};
    if (sortBy === 'name') {
      sort.name = sortOrder;
    } else if (sortBy === 'joiningDate') {
      sort.joiningDate = sortOrder;
    } else {
      sort[sortBy] = sortOrder;
    }

    // Execute queries
    const employees = await Employee.find(query)
      .populate('reportingManager', 'name email employeeId')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);

    return res.status(200).json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// GET /api/employees/dropdown - Minimal info for dropdown selections
export const getEmployeesDropdown = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await Employee.find({ isDeleted: false, status: 'Active' })
      .select('name role employeeId email')
      .sort({ name: 1 });

    return res.status(200).json(employees);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// GET /api/employees/:id - Retrieve individual employee details
export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, isDeleted: false })
      .populate('reportingManager', 'name email employeeId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.status(200).json(employee);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// POST /api/employees - Create new employee (with RBAC validation)
export const createEmployee = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;

  if (!currentUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const {
    name,
    email,
    password,
    phone,
    department,
    designation,
    salary,
    joiningDate,
    status,
    role,
    reportingManager,
    profileImage
  } = req.body;

  // RBAC validation: HR Manager cannot assign the 'Super Admin' role to anyone
  if (currentUser.role === 'HR Manager' && role === 'Super Admin') {
    return res.status(403).json({ message: 'Forbidden: HR Managers cannot create Super Admins' });
  }

  try {
    // Check if email already exists
    const emailExists = await Employee.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'An employee with this email already exists' });
    }

    // Verify reporting manager exists
    if (reportingManager) {
      const manager = await Employee.findById(reportingManager);
      if (!manager || manager.isDeleted) {
        return res.status(400).json({ message: 'Selected reporting manager does not exist' });
      }
    }

    const newEmployee = new Employee({
      name,
      email,
      password,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      status,
      role,
      reportingManager: reportingManager || null,
      profileImage: profileImage || ''
    });

    await newEmployee.save();

    // Do not return password in response
    const saved = newEmployee.toObject();
    delete saved.password;

    return res.status(201).json(saved);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create employee', error: (error as Error).message });
  }
};

// PUT /api/employees/:id - Update employee (with RBAC validation)
export const updateEmployee = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  const targetId = req.params.id;

  if (!currentUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const employee = await Employee.findById(targetId);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // RBAC logic
    if (currentUser.role === 'Employee') {
      // Employees can only update their own profiles
      if (currentUser.id !== targetId) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
      }

      // Employees can only update limited fields
      const allowedUpdates = ['name', 'phone', 'password', 'profileImage'];
      const updates = Object.keys(req.body);
      const isAllowed = updates.every((update) => allowedUpdates.includes(update));

      if (!isAllowed) {
        return res.status(403).json({ message: 'Forbidden: You can only update name, phone, password, and profile image' });
      }
    }

    if (currentUser.role === 'HR Manager') {
      // HR Managers cannot update Super Admins
      if (employee.role === 'Super Admin') {
        return res.status(403).json({ message: 'Forbidden: HR Managers cannot modify Super Admins' });
      }

      // HR Managers cannot change roles to Super Admin
      if (req.body.role === 'Super Admin') {
        return res.status(403).json({ message: 'Forbidden: HR Managers cannot assign the Super Admin role' });
      }
    }

    // Check circular reporting if reporting manager is being updated
    if (req.body.reportingManager !== undefined) {
      const newManager = req.body.reportingManager;
      if (newManager) {
        const isCircular = await isCircularReporting(targetId, newManager);
        if (isCircular) {
          return res.status(400).json({ message: 'Circular reporting detected. An employee cannot report to their own direct/indirect reportee.' });
        }
      }
    }

    // Apply updates
    const fieldsToUpdate = req.body;
    for (const key of Object.keys(fieldsToUpdate)) {
      if (key === 'password' && fieldsToUpdate[key] === '') {
        continue; // Skip setting empty password
      }
      (employee as any)[key] = fieldsToUpdate[key];
    }

    await employee.save();

    const updated = employee.toObject();
    delete updated.password;

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update employee', error: (error as Error).message });
  }
};

// DELETE /api/employees/:id - Soft Delete (Super Admin only, check RBAC)
export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;
  const targetId = req.params.id;

  if (!currentUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // HR Managers and Employees cannot delete employees
  if (currentUser.role !== 'Super Admin') {
    return res.status(403).json({ message: 'Forbidden: Only Super Admins can delete employees' });
  }

  try {
    const employee = await Employee.findById(targetId);
    if (!employee || employee.isDeleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Soft delete
    employee.isDeleted = true;
    employee.status = 'Inactive';
    await employee.save();

    // Reassign reportees of the deleted employee to null (or we could reassign to their manager)
    await Employee.updateMany(
      { reportingManager: targetId },
      { reportingManager: null }
    );

    return res.status(200).json({ message: 'Employee soft-deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete employee', error: (error as Error).message });
  }
};

// POST /api/employees/bulk - CSV upload / Bulk import
export const bulkImportEmployees = async (req: AuthRequest, res: Response) => {
  const currentUser = req.user;

  if (!currentUser || (currentUser.role !== 'Super Admin' && currentUser.role !== 'HR Manager')) {
    return res.status(403).json({ message: 'Forbidden: Insufficient privileges for bulk import' });
  }

  const { employees } = req.body;

  if (!Array.isArray(employees) || employees.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty employees list' });
  }

  const results = {
    successCount: 0,
    failCount: 0,
    errors: [] as { row: number; email: string; reason: string }[]
  };

  for (let i = 0; i < employees.length; i++) {
    const empData = employees[i];
    const rowNum = i + 1;

    try {
      // Basic validation
      if (!empData.name || !empData.email || !empData.password || !empData.department || !empData.designation) {
        results.failCount++;
        results.errors.push({
          row: rowNum,
          email: empData.email || 'N/A',
          reason: 'Missing required fields (name, email, password, department, designation)'
        });
        continue;
      }

      // HR cannot import Super Admins
      if (currentUser.role === 'HR Manager' && empData.role === 'Super Admin') {
        results.failCount++;
        results.errors.push({
          row: rowNum,
          email: empData.email,
          reason: 'HR Managers cannot create Super Admin accounts'
        });
        continue;
      }

      // Check unique email
      const existing = await Employee.findOne({ email: empData.email.toLowerCase() });
      if (existing) {
        results.failCount++;
        results.errors.push({
          row: rowNum,
          email: empData.email,
          reason: 'Email already exists'
        });
        continue;
      }

      // Map details
      const newEmp = new Employee({
        name: empData.name,
        email: empData.email.toLowerCase(),
        password: empData.password,
        phone: empData.phone || '0000000000',
        department: empData.department,
        designation: empData.designation,
        salary: Number(empData.salary) || 0,
        joiningDate: empData.joiningDate ? new Date(empData.joiningDate) : new Date(),
        status: empData.status || 'Active',
        role: empData.role || 'Employee',
        reportingManager: null, // Initial seed from CSV can update managers later or we search by email if provided
        profileImage: empData.profileImage || ''
      });

      // Try finding manager by email if managerEmail is provided
      if (empData.managerEmail) {
        const mgr = await Employee.findOne({ email: empData.managerEmail.toLowerCase(), isDeleted: false });
        if (mgr) {
          newEmp.reportingManager = mgr._id as mongoose.Types.ObjectId;
        }
      }

      await newEmp.save();
      results.successCount++;
    } catch (err: any) {
      results.failCount++;
      results.errors.push({
        row: rowNum,
        email: empData.email || 'N/A',
        reason: err.message
      });
    }
  }

  return res.status(200).json({
    message: `Import completed: ${results.successCount} succeeded, ${results.failCount} failed.`,
    ...results
  });
};
