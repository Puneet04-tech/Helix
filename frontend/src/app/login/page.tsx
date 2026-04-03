'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token to localStorage
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          organizationId,
          role: 'developer',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token to localStorage
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1A2F5E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldAlert className="w-8 h-8 text-[#5BA4F5]" />
            <h1 className="text-3xl font-bold text-[#5BA4F5]">Helix</h1>
          </div>
          <p className="text-slate-400 text-sm">Autonomous Threat Detection & Response</p>
        </div>

        {/* Card */}
        <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-lg p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isRegister ? 'Create Account' : 'Login'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
            {/* Register Fields */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
                    placeholder="Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Organization ID
                  </label>
                  <input
                    type="text"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
                    placeholder="org_12345"
                    required
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none"
                placeholder="••••••••"
                required
              />
              {isRegister && (
                <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2979CC] hover:bg-[#1F5AA8] disabled:bg-slate-600 text-white font-medium py-2 rounded-lg transition-colors mt-6"
            >
              {isLoading ? 'Loading...' : isRegister ? 'Create Account' : 'Login'}
            </button>
          </form>

          {/* Toggle Register */}
          <div className="mt-6 pt-6 border-t border-[#1E3A5F] text-center">
            <p className="text-slate-400 text-sm">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-[#5BA4F5] hover:text-[#7BC5FF] font-medium"
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
