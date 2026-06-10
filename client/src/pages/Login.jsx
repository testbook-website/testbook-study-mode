import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AlertCircle, BookOpen, Zap } from 'lucide-react';

const TB_LOGO = 'https://testbook-trickbook.duckdns.org/_next/image?url=%2Flogos%2Ftestbook-icon.png&w=48&q=75';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 40%, #fde68a 100%)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f97316 0%, #ef4444 60%, #dc2626 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={TB_LOGO} alt="Testbook" className="w-14 h-14 rounded-2xl shadow-lg" onError={e => { e.target.style.display='none'; }} />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Study Smarter.<br />Score Higher.
          </h2>
          <p className="text-white/80 text-lg max-w-xs mx-auto leading-relaxed">
            Your complete digital library with AI-powered doubt solving and smart summaries.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto text-left">
            {['AI Doubt Solver', 'Smart Summaries', 'Highlights & Notes', 'Progress Tracking'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-yellow-300" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <img src={TB_LOGO} alt="Testbook" className="w-10 h-10 rounded-xl" onError={e => { e.target.style.display='none'; }} />
            <span className="font-black text-xl text-orange-600">Testbook Study Mode</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-orange-100 border border-orange-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-black text-gray-900">Welcome back!</h1>
              <p className="text-gray-500 text-sm mt-1">Log in to your study workspace</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:translate-y-[1px] transition-all disabled:opacity-60 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
              >
                {loading ? 'Logging in...' : 'Log In →'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-orange-500 hover:text-orange-600 font-bold">
                Register here
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            For testing, register as Admin or Student on the next screen.
          </p>
        </div>
      </div>
    </div>
  );
}
