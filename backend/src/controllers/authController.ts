import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find employee and explicitly select password and isDeleted
    const employee = await Employee.findOne({ email: email.toLowerCase() }).select('+password');

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
    const token = jwt.sign(
      {
        id: employee._id,
        email: employee.email,
        role: employee.role
      },
      secret,
      { expiresIn: expiresIn as any }
    );


    return res.status(200).json({
      token,
      id: employee._id,
      employeeId: employee.employeeId,
      role: employee.role,
      name: employee.name,
      email: employee.email
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const logout = async (req: Request, res: Response) => {
  // Clear token logic for clients using cookies (optional but good practice)
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};
