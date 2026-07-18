'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, Users, Network, LogOut, User as UserIcon } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Super Admin', 'HR Manager', 'Employee']
    },
    {
      name: 'Employees',
      href: '/dashboard/employees',
      icon: Users,
      roles: ['Super Admin', 'HR Manager', 'Employee']
    },
    {
      name: 'Org Tree',
      href: '/dashboard/organization',
      icon: Network,
      roles: ['Super Admin', 'HR Manager', 'Employee']
    }

  ];

  const filteredLinks = links.filter((link) => link.roles.includes(user.role));

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-colors duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide">
            EMS Portal
          </h1>
          <ThemeToggle />
        </div>

        <nav className="space-y-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                    : 'text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-250'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user.role}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
