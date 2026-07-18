'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Users, UserCheck, UserMinus, FolderGit2, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface EmployeeData {
  _id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  department: string;
  role: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all active/inactive employees to compute dashboard stats (using high limit)
        const response = await api.get('/employees?limit=1000');
        setEmployees(response.data.employees || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  // Calculations
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const inactiveEmployees = employees.filter((e) => e.status === 'Inactive').length;

  const departmentCounts: { [key: string]: number } = {};
  employees.forEach((emp) => {
    const dept = emp.department || 'Other';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });

  const departmentList = Object.entries(departmentCounts).map(([name, count]) => ({
    name,
    count
  }));

  const maxCount = Math.max(...departmentList.map((d) => d.count), 1);
  const totalDepartments = departmentList.length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here is what is happening with your organization today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Employees</p>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{totalEmployees}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Staff</p>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{activeEmployees}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Inactive Employees */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Inactive Staff</p>
            <h3 className="text-3xl font-bold text-zinc-500 dark:text-zinc-400 mt-1">{inactiveEmployees}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
            <UserMinus className="h-6 w-6" />
          </div>
        </div>

        {/* Total Departments */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Departments</p>
            <h3 className="text-3xl font-bold text-purple-650 dark:text-purple-400 mt-1">{totalDepartments}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FolderGit2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid of Chart & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Chart Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs lg:col-span-2">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">
            Employees per Department
          </h3>
          {departmentList.length > 0 ? (
            <div className="space-y-4">
              {departmentList.map((dept) => {
                const percentage = (dept.count / maxCount) * 100;
                return (
                  <div key={dept.name} className="group">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{dept.name}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                        {dept.count} {dept.count === 1 ? 'employee' : 'employees'}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-blue-500 to-indigo-650 rounded-full transition-all duration-500 ease-out group-hover:from-blue-650 group-hover:to-indigo-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-400">
              No department data available.
            </div>
          )}
        </div>

        {/* Quick Links / Actions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Navigate to core management modules to view, edit, or customize organization settings.
            </p>
            <div className="space-y-3">
              <Link
                href="/dashboard/employees"
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-sm font-semibold transition-all duration-150"
              >
                <span>View Employee List</span>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>
              <Link
                href="/dashboard/organization"
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-sm font-semibold transition-all duration-150"
              >
                <span>View Organizational Tree</span>
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </Link>

            </div>
          </div>

          <div className="mt-8 text-center text-xs text-zinc-400">
            Employee Management System &bull; Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
