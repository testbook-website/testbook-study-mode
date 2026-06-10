import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { AlertCircle, GraduationCap, ShieldCheck } from 'lucide-react';

const TB_LOGO = 'https://testbook-trickbook.duckdns.org/_next/image?url=%2Flogos%2Ftestbook-icon.png&w=48&q=75';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(name, email, password, role);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 40%, #fde68a 100%)' }}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-7 justify-center">
          <img src={TB_LOGO} alt="Testbook" className="w-10 h-10 rounded-xl" onError={e => { e.target.style.display='none'; }} />
          <span className="font-black text-xl text-orange-600">Testbook Study Mode</span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100 border border-orange-100 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Join the digital learning workspace</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
              className="w-full text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-orange-200 active:translate-y-[1px] transition-all disabled:opacity-60 cursor-pointer mt-2"
              style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
            >
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-bold">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
