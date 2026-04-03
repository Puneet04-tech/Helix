'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production, connect to backend API
      if (email && password) {
        // Simulated login
        localStorage.setItem('token', 'demo-token');
        router.push('/dashboard');
      } else {
        setError('Please enter email and password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1A3A6E] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-[#5BA4F5]" />
            <h1 className="text-3xl font-bold text-[#5BA4F5]">AI Guardian</h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400 mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:border-[#2979CC] focus:outline-none transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0D1B3E] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:border-[#2979CC] focus:outline-none transition-colors"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2979CC] hover:bg-[#1A56A0] text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-400 mt-6">
            Demo: Use any email and password to test
          </div>
        </div>
      </div>
    </div>
  );
}
