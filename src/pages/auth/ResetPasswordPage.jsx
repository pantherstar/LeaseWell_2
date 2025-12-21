import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { authService } from '../../services/supabase/auth.service';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!data?.session) {
          setError('This reset link is invalid or expired. Please request a new one.');
        }
      } catch {
        if (mounted) {
          setError('Unable to validate this reset link. Please request a new one.');
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccess('Password updated. You can now sign in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err?.message || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1513] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_55%)]" />
      <div className="absolute -top-24 -right-20 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 bg-amber-400/15 blur-[120px] rounded-full" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
            <img src="/favicon.png" alt="LeaseWell" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Reset your password
          </h1>
          <p className="text-emerald-100/70 mt-2">Choose a new password for your account.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {checking ? (
            <div className="flex items-center justify-center py-12 text-emerald-100/70">
              Validating reset link...
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl mb-5">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl mb-5">
                  <p className="text-emerald-100 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-emerald-100/70 mb-2">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#101f1b] border border-emerald-500/20 rounded-xl text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500"
                      required
                      disabled={Boolean(error)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-emerald-100/70 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#101f1b] border border-emerald-500/20 rounded-xl text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500"
                      required
                      disabled={Boolean(error)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || Boolean(error)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update password <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full text-sm text-emerald-200/70 hover:text-emerald-100"
              >
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
