import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Key, Mail, Home, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, mockLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [userType, setUserType] = useState('landlord');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submitTimeoutRef = useRef(null);
  const [rateLimitMessage, setRateLimitMessage] = useState('');

  const attemptKey = 'leasewell_login_attempts';
  const attemptWindowMs = 10 * 60 * 1000;
  const attemptLimit = 5;

  const pruneAttempts = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(attemptKey) || '[]');
    const recent = attempts.filter((timestamp) => now - timestamp < attemptWindowMs);
    localStorage.setItem(attemptKey, JSON.stringify(recent));
    return recent;
  };

  const recordAttempt = () => {
    const attempts = pruneAttempts();
    attempts.push(Date.now());
    localStorage.setItem(attemptKey, JSON.stringify(attempts));
  };

  const getRateLimitState = () => {
    const attempts = pruneAttempts();
    if (attempts.length < attemptLimit) {
      return { blocked: false, remainingMs: 0 };
    }
    const earliest = Math.min(...attempts);
    const remainingMs = Math.max(0, attemptWindowMs - (Date.now() - earliest));
    return { blocked: true, remainingMs };
  };

  const resetAttempts = () => {
    localStorage.removeItem(attemptKey);
  };

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRateLimitMessage('');

    if (!isSignUp) {
      const { blocked, remainingMs } = getRateLimitState();
      if (blocked) {
        setLoading(false);
        setRateLimitMessage(`Too many attempts. Try again in ${Math.ceil(remainingMs / 60000)} minutes.`);
        return;
      }
    }

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    submitTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError('This is taking longer than expected. Please try again.');
    }, 12000);

    try {
      if (isSignUp) {
        // Signup mode
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const result = await signUp({ email, password, fullName, role: userType });

        if (result.error) {
          setError(result.error);
        } else {
          // Successfully signed up, navigate to dashboard
          navigate('/dashboard');
        }
      } else {
        // Login mode
        const result = await signIn({ email, password });

        if (result.error) {
          setError(result.error);
          recordAttempt();
        } else {
          // Successfully logged in, navigate to dashboard
          resetAttempts();
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1513] text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_55%)]" />
      <div className="absolute -top-24 -right-20 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 bg-amber-400/15 blur-[120px] rounded-full" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg shadow-emerald-500/25">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>LeaseWell</h1>
          <p className="text-emerald-100/70 mt-2">Property Management Simplified</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-[#101f1b] rounded-xl p-1 mb-8">
            <button onClick={() => setUserType('landlord')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userType === 'landlord' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-emerald-100/60 hover:text-white'}`}>
              <Key className="w-4 h-4" />Landlord
            </button>
            <button onClick={() => setUserType('tenant')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userType === 'tenant' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'text-emerald-100/60 hover:text-white'}`}>
              <Home className="w-4 h-4" />Tenant
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {(error || rateLimitMessage) && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                <p className="text-red-200 text-sm">{rateLimitMessage || error}</p>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-emerald-100/70 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#101f1b] border border-emerald-500/20 rounded-xl text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500" required />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-emerald-100/70 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#101f1b] border border-emerald-500/20 rounded-xl text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-100/70 mb-2">Password</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#101f1b] border border-emerald-500/20 rounded-xl text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500" required />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-emerald-100/70 mb-2">Confirm Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-100/40" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#101f1b] border border-emerald-500/20 rounded-xl text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500" required />
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-emerald-100/60 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-emerald-500/40 text-emerald-500 bg-[#101f1b]" />Remember me
                </label>
                <a href="#" className="text-emerald-300 hover:text-emerald-200">Forgot password?</a>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </>
              ) : (
                <>{isSignUp ? `Create ${userType === 'landlord' ? 'Landlord' : 'Tenant'} Account` : `Sign in as ${userType === 'landlord' ? 'Landlord' : 'Tenant'}`}</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-emerald-100/60 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-emerald-300 hover:text-emerald-200 font-medium"
              >
                {isSignUp ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>
        </div>
        <p className="text-center text-emerald-100/50 text-sm mt-6">© 2025 LeaseWell. A product of Northridge Technologies LLC.</p>
      </div>
    </div>
  );
};

export default LoginPage;
