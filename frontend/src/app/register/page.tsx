'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !firstName || !lastName) {
      setError('All fields are required except the organization ID.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        organizationId: organizationId || 'default',
        role,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-[#2979CC] focus:outline-none';

  return (
    <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldAlert className="w-8 h-8 text-[#5BA4F5]" />
          <span className="text-2xl font-bold text-[#5BA4F5]">Helix</span>
        </div>

        <div className="bg-[#112D5E] border border-[#1E3A5F] rounded-xl p-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            Create your account
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            Join Helix autonomous threat detection
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="Ada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Lovelace"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@organization.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Organization ID
              </label>
              <input
                type="text"
                value={organizationId}
                onChange={e => setOrganizationId(e.target.value)}
                className={inputClass}
                placeholder="default"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-[#0A1428] border border-[#1E3A5F] rounded-lg px-4 py-2 text-slate-300 focus:border-[#2979CC] focus:outline-none"
              >
                <option value="developer">Developer</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2979CC] hover:bg-[#1F5AA8] disabled:bg-slate-600 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#5BA4F5] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}