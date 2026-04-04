'use client';

import React from 'react';
import { Bell, User, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user } = useAuth();
  
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  return (
    <header className="bg-[#112D5E] border-b border-[#1E3A5F] px-6 py-4 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search incidents..."
            className="w-full bg-[#112D5E] border border-[#1E3A5F] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 ml-6">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-[#1A3A6E] rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-400 hover:text-slate-200" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-3 px-3 py-2 hover:bg-[#1A3A6E] rounded-lg transition-colors">
          <div className="w-8 h-8 bg-[#2979CC] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-slate-200">{displayName}</div>
            <div className="text-xs text-slate-400">{userRole}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
