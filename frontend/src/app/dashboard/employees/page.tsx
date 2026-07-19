'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';

import {
  Search,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Upload,
  ArrowUpDown,
  X,
  Loader2,
  Users
} from 'lucide-react';

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  profileImage?: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  reportingManager: {
    _id: string;
    name: string;
    employeeId: string;
  } | null;
}

export default function EmployeesPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lists & State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dropdownList, setDropdownList] = useState<{ _id: string; name: string; role: string; employeeId: string; designation?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination, Filter, Search, Sort
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formRole, setFormRole] = useState<'Super Admin' | 'HR Manager' | 'Employee'>('Employee');
  const [formManager, setFormManager] = useState('');
  const [formProfileImage, setFormProfileImage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // CSV Import State
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

  // Fetch lists
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        search,
        department,
        role,
        status,
        sortBy,
        sortOrder
      });
      const response = await api.get(`/employees?${params.toString()}`);
      setEmployees(response.data.employees || []);
      setTotalPages(response.data.pagination.pages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch employees.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async () => {
    try {
      const response = await api.get('/employees/dropdown');
      setDropdownList(response.data || []);
    } catch (err) {
      console.error('Failed to load managers dropdown');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search, department, role, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchDropdown();
  }, []);

  // Sort toggle helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Form Validation
  const validateForm = () => {
    if (!formName || !formEmail || !formPhone || !formDepartment || !formDesignation || !formSalary || !formJoiningDate) {
      return 'Please fill in all required fields.';
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formEmail)) {
      return 'Please enter a valid email address.';
    }

    if (formPhone.length < 8) {
      return 'Phone number must be at least 8 characters.';
    }

    if (Number(formSalary) <= 0) {
      return 'Salary must be a positive number.';
    }

    if (modalMode === 'add' && !formPassword) {
      return 'Password is required when creating an employee.';
    }

    return null;
  };

  // Open Add Modal
  const openAddModal = () => {
    setModalMode('add');
    setSelectedEmpId(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormDepartment('');
    setFormDesignation('');
    setFormSalary('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Active');
    setFormRole('Employee');
    setFormManager('');
    setFormProfileImage('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (emp: Employee) => {
    setModalMode('edit');
    setSelectedEmpId(emp._id);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPassword(''); // Empty by default
    setFormPhone(emp.phone);
    setFormDepartment(emp.department);
    setFormDesignation(emp.designation);
    setFormSalary(emp.salary.toString());
    setFormJoiningDate(emp.joiningDate ? emp.joiningDate.split('T')[0] : '');
    setFormStatus(emp.status);
    setFormRole(emp.role);
    setFormManager(emp.reportingManager?._id || '');
    setFormProfileImage(emp.profileImage || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    const payload: any = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      department: formDepartment,
      designation: formDesignation,
      salary: Number(formSalary),
      joiningDate: new Date(formJoiningDate),
      status: formStatus,
      role: formRole,
      reportingManager: formManager || null,
      profileImage: formProfileImage
    };

    if (formPassword) {
      payload.password = formPassword;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/employees', payload);
      } else {
        await api.put(`/employees/${selectedEmpId}`, payload);
      }

      setIsModalOpen(false);
      fetchEmployees();
      fetchDropdown();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Soft Delete Employee
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee? (Soft Delete)')) return;

    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
      fetchDropdown();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  // CSV Parsing and Upload
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length <= 1) {
        setCsvMessage('Empty or invalid CSV file.');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const employeesToImport: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic split, handling potential quotes if needed, or simple split
        const values = line.split(',').map((v) => v.trim());

        const emp: any = {};
        headers.forEach((header, index) => {
          emp[header] = values[index] || '';
        });

        employeesToImport.push(emp);
      }

      try {
        setLoading(true);
        const response = await api.post('/employees/bulk', { employees: employeesToImport });
        setCsvMessage(response.data.message);
        fetchEmployees();
        fetchDropdown();
      } catch (err: any) {
        setCsvMessage(err.response?.data?.message || 'Failed to import CSV.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Employees Directory
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            View, filter, edit, or add records for organization staff.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3">
          {(user?.role === 'Super Admin' || user?.role === 'HR Manager') && (
            <>
              {/* CSV Upload */}
              <label className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-sm font-semibold text-zinc-755 dark:text-zinc-350 cursor-pointer shadow-xs transition-all">
                <Upload className="h-4 w-4" />
                <span>CSV Import</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleCsvImport}
                  className="hidden"
                />
              </label>

              {/* Add Employee */}
              <button
                onClick={openAddModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Employee</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* CSV feedback alert */}
      {csvMessage && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-between">
          <span>{csvMessage}</span>
          <button onClick={() => setCsvMessage(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-900 dark:text-white text-sm placeholder-zinc-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Dept filter */}
        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-900 dark:text-white text-sm focus:outline-hidden"
        >
          <option value="">All Departments</option>
          <option value="Management">Management</option>
          <option value="Engineering">Engineering</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Design">Design</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
        </select>

        {/* Role filter */}
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-900 dark:text-white text-sm focus:outline-hidden"
        >
          <option value="">All Roles</option>
          <option value="Super Admin">Super Admin</option>
          <option value="HR Manager">HR Manager</option>
          <option value="Employee">Employee</option>
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-900 dark:text-white text-sm focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Employee Data Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
            <Users className="h-10 w-10 mb-2 stroke-1" />
            <p className="text-sm">No employees found matching the filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs font-semibold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white" onClick={() => handleSort('name')}>
                    <span className="flex items-center space-x-1">
                      <span>Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-zinc-900 dark:hover:text-white" onClick={() => handleSort('joiningDate')}>
                    <span className="flex items-center space-x-1">
                      <span>Joined</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-350">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{emp.employeeId || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs overflow-hidden">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            emp.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-white">{emp.name}</div>
                          <div className="text-xs text-zinc-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{emp.department}</td>
                    <td className="px-6 py-4">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        emp.role === 'Super Admin'
                          ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                          : emp.role === 'HR Manager'
                          ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-450'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-800 dark:text-zinc-300">
                      {emp.reportingManager ? emp.reportingManager.name : <span className="text-zinc-400 font-normal">None</span>}
                    </td>
                    <td className="px-6 py-4">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.status === 'Active'
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-950/30 text-red-750 dark:text-red-400'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Edit Action */}
                        {(user?.role === 'Super Admin' || user?.role === 'HR Manager' || user?.id === emp._id) && (
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete Action (Super Admin Only) */}
                        {user?.role === 'Super Admin' && (
                          <button
                            onClick={() => handleDelete(emp._id)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && employees.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/10 text-sm text-zinc-500">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {modalMode === 'add' ? 'Add Employee Record' : 'Edit Employee Record'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-650">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {formError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-650 dark:text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Name *</label>
                  <input
                    type="text"
                    disabled={user?.role === 'Employee'}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Email *</label>
                  <input
                    type="email"
                    disabled={user?.role === 'Employee'}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Password (Only Editable/Addable) */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">
                    {modalMode === 'add' ? 'Password *' : 'Password (leave blank to keep unchanged)'}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Phone *</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Department *</label>
                  <select
                    disabled={user?.role === 'Employee'}
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="">Select Department</option>
                    <option value="Management">Management</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Design">Design</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Designation *</label>
                  <input
                    type="text"
                    disabled={user?.role === 'Employee'}
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Salary ($) *</label>
                  <input
                    type="number"
                    disabled={user?.role === 'Employee'}
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Joining Date */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Joining Date *</label>
                  <input
                    type="date"
                    disabled={user?.role === 'Employee'}
                    value={formJoiningDate}
                    onChange={(e) => setFormJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Profile Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Profile Image URL</label>
                  <input
                    type="text"
                    value={formProfileImage}
                    onChange={(e) => setFormProfileImage(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Status</label>
                  <select
                    disabled={user?.role === 'Employee'}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Role *</label>
                  <select
                    disabled={user?.role === 'Employee'}
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  >
                    {/* Super Admin can set all; HR Manager can set HR and Employee; Employee cannot select */}
                    {user?.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
                    {(user?.role === 'Super Admin' || user?.role === 'HR Manager') && (
                      <option value="HR Manager">HR Manager</option>
                    )}
                    <option value="Employee">Employee</option>
                  </select>
                </div>

                {/* Reporting Manager */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Reporting Manager</label>
                  <select
                    disabled={user?.role === 'Employee'}
                    value={formManager}
                    onChange={(e) => setFormManager(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="">None (Top Level Root)</option>
                    {dropdownList
                      .filter((emp) => emp._id !== selectedEmpId) // Prevent self reporting selection
                      .map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} ({(emp as any).designation || emp.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 text-sm font-semibold text-zinc-650 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center"
                >
                  {formSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <span>{modalMode === 'add' ? 'Create' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
