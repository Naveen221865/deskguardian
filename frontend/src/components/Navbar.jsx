import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-indigo-100/40"
      style={{ background: '#f1f5ff' }}>
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <button onClick={() => nav('/')}
          className="flex items-center gap-2 font-black text-xl hover:opacity-75 transition-opacity">
          <span className="text-2xl">📚</span>
          <span className="shimmer-text">DeskGuard</span>
        </button>

        <div className="flex items-center gap-2">
          {user?.role === 'librarian' && (
            <button onClick={() => nav('/admin')}
              className={`text-sm font-bold px-4 py-1.5 rounded-xl transition-all ${
                pathname === '/admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-700 hover:bg-indigo-50'
              }`}>
              Dashboard
            </button>
          )}
          <div className="flex items-center gap-2 pl-3 border-l border-indigo-200">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">{user?.name}</span>
          </div>
          <button onClick={() => { logout(); nav('/login'); }}
            className="text-sm px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 font-bold transition-all border border-red-200">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
