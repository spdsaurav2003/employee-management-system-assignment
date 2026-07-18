'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';

import { Loader2, AlertCircle, ShieldAlert, ArrowRight, UserPlus, GitCommit } from 'lucide-react';

interface TreeNode {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  designation: string;
  department: string;
  status: 'Active' | 'Inactive';
  profileImage: string;
  children: TreeNode[];
}

export default function OrganizationPage() {
  const { user } = useAuth();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [dropdownList, setDropdownList] = useState<{ _id: string; name: string; designation: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reassign Manager State
  const [selectedEmp, setSelectedEmp] = useState<TreeNode | null>(null);
  const [newManagerId, setNewManagerId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const response = await api.get('/organization/tree');
      setTreeData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch organization hierarchy.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async () => {
    try {
      const response = await api.get('/employees/dropdown');
      setDropdownList(response.data || []);
    } catch (err) {
      console.error('Failed to load dropdown list');
    }
  };

  useEffect(() => {
    fetchTree();
    fetchDropdown();
  }, []);

  const handleReassignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      await api.patch(`/employees/${selectedEmp._id}/manager`, {
        reportingManager: newManagerId || null
      });
      setSelectedEmp(null);
      setNewManagerId('');
      fetchTree();
      fetchDropdown();
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to update manager.');
    } finally {
      setUpdating(false);
    }
  };

  // Check if current user is allowed to reassign managers
  const canReassign = user?.role === 'Super Admin' || user?.role === 'HR Manager';

  // Recursive Node Renderer
  const renderNode = (node: TreeNode) => {
    return (
      <div key={node._id} className="flex flex-col items-center select-none">
        {/* Node Box */}
        <div className="relative group flex flex-col items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs px-4 py-3 min-w-[200px] max-w-[260px] text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 z-10">
          <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-bold text-sm text-blue-600 dark:text-blue-400 overflow-hidden mb-2">
            {node.profileImage ? (
              <img src={node.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              node.name.split(' ').map((n) => n[0]).join('')
            )}
          </div>

          <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate w-full">{node.name}</h4>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium truncate w-full">{node.designation}</p>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mt-1">{node.department}</span>

          {/* Quick Info & Reassign button on hover */}
          {canReassign && (
            <div className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 flex flex-col items-center justify-center p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[10px] font-mono text-zinc-450 dark:text-zinc-500 mb-1.5">{node.employeeId}</span>
              {/* If HR Manager, hide option to modify Super Admins */}
              {!(user?.role === 'HR Manager' && node.role === 'Super Admin') ? (
                <button
                  onClick={() => {
                    setSelectedEmp(node);
                    setNewManagerId(node._id); // default placeholder
                    setUpdateError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-650 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  Change Manager
                </button>
              ) : (
                <div className="flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-semibold gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Restricted (Super Admin)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Children connections */}
        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full mt-4">
            {/* Vertical connector line downward from parent */}
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

            {/* Horizontal line wrapping children */}
            <div className="flex w-full justify-center">
              {node.children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === node.children.length - 1;
                const hasSiblings = node.children.length > 1;

                return (
                  <div key={child._id} className="flex flex-col items-center relative">
                    {/* Horizontal connector lines */}
                    {hasSiblings && (
                      <div
                        className={`absolute top-0 h-px bg-zinc-300 dark:bg-zinc-700 ${
                          isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                        }`}
                      />
                    )}
                    {/* Vertical connector line down to child */}
                    <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
                    <div className="px-4">{renderNode(child)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Organizational Chart
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Visualize reporting lines and structural relations across your company.
        </p>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : treeData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-zinc-450 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">Seeding incomplete or database contains no employees.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 overflow-auto shadow-xs max-h-[75vh] flex justify-center min-w-full">
          {/* Render roots */}
          <div className="flex space-x-12">
            {treeData.map((root) => renderNode(root))}
          </div>
        </div>
      )}

      {/* Change Manager Modal Overlay */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Reassign Reporting Line</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mb-6">
              Modify the reporting structure for <strong>{selectedEmp.name}</strong>. The system will prevent circular dependencies.
            </p>

            {updateError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-650 dark:text-red-400">
                {updateError}
              </div>
            )}

            <form onSubmit={handleReassignManager} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Select New Manager
                </label>
                <select
                  value={newManagerId}
                  onChange={(e) => setNewManagerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 text-zinc-900 dark:text-white text-sm"
                >
                  <option value="">None (Top Level Root)</option>
                  {dropdownList
                    .filter((emp) => emp._id !== selectedEmp._id) // Cannot report to self
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.designation || emp.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedEmp(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 text-sm font-semibold text-zinc-650 hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl bg-blue-650 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center"
                >
                  {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <span>Save Structure</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
