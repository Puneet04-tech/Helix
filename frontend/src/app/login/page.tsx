'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function ShieldAlert(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 22s8-4 8-10V6l-8-3-8 3v6c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login: contextLogin, register: contextRegister } = useAuth();
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
      await contextLogin(email, password);
      // Navigate after successful login
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
      await contextRegister({
        email,
        password,
        firstName,
        lastName,
        organizationId,
        role: 'developer',
      });
      // Navigate after successful registration
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
                autoComplete="email"
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
                autoComplete="current-password"
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

          {/* Back to Home Link */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-slate-400 hover:text-slate-200 text-sm transition-colors inline-flex items-center gap-1"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
