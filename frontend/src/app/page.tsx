'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#0D1B3E] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5BA4F5] mx-auto mb-4"></div>
        <p className="text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
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
