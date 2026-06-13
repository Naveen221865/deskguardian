import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', roll_no: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await api.post('/auth/register', form);
        setMode('login');
        setForm(f => ({ ...f, name: '', roll_no: '' }));
      } else {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
        login(data.token, data.user);
        nav(data.user.role === 'librarian' ? '/admin' : '/');
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}>

      {/* Animated gradient orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <span className="text-5xl">📚</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">DeskGuard</h1>
          <p className="text-indigo-100 text-sm">Smart Library Seat Management</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Tab Switcher */}
          <div className="flex bg-gray-50 p-1.5 m-4 rounded-2xl">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all capitalize ${
                  mode === m
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {m}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="px-6 pb-6 pt-2 space-y-4">
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input name="name" placeholder="John Doe" value={form.name} onChange={handle}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Roll Number
                  </label>
                  <input name="roll_no" placeholder="CS2024001" value={form.roll_no} onChange={handle}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    required />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input name="email" type="email" placeholder="you@college.edu" value={form.email} onChange={handle}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                required />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Password
              </label>
              <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handle}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                required />
            </div>

            <button disabled={loading}
              className="w-full py-4 rounded-xl text-base font-black text-white transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-6"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {mode === 'login' && (
              <p className="text-center text-xs text-gray-500 pt-2">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-indigo-600 font-bold hover:underline">
                  Register here
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-center text-xs text-gray-500 pt-2">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-indigo-600 font-bold hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white/80 text-xs mt-8 flex items-center justify-center gap-2">
          <span>🔒</span>
          Secure & encrypted authentication
        </p>
      </div>
    </div>
  );
}
