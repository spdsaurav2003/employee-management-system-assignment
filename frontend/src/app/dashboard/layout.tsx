'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/Sidebar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <div className="absolute h-8 w-8 rounded-full bg-blue-50 dark:bg-zinc-900"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
          Loading EMS...
        </p>
      </div>
    );
  }

  if (!user) {
    return null; // Prevents flashing before redirect completes
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
