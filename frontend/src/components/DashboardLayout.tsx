'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ProtectedRoute } from './ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[#0D1B3E]">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />

          {/* Content */}
          <main className="flex-1 overflow-auto p-6 bg-[#0D1B3E]">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
