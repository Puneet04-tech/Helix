'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Home,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
    { name: 'Status', href: '/status', icon: BarChart3 },
    { name: 'Chatbot', href: '/chatbot', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-56 bg-[#0D1B3E] border-r border-[#1E3A5F] px-3 py-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-3 py-2.5">
        <ShieldAlert className="w-6 h-6 text-[#5BA4F5]" />
        <span className="text-xl font-bold text-[#5BA4F5]">AI Guardian</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#1A3A6E] text-[#5BA4F5] border-l-2 border-[#2979CC]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A3A6E]'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-red-900/20 transition-colors">
        <LogOut className="w-4.5 h-4.5" />
        Logout
      </button>
    </div>
  );
}
