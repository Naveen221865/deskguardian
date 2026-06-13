import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function CheckIn() {
  const { qr } = useParams();
  const [desk, setDesk] = useState(null);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!user) return nav('/login');
    api.get(`/desks/qr/${qr}`).then(r => setDesk(r.data)).catch(() => setMsg('Invalid QR code'));
  }, [qr, user, nav]);

  async function checkin() {
    setLoading(true);
    try {
      await api.post('/desks/checkin', { desk_id: desk.desk_id });
      setDone(true);
      setTimeout(() => nav('/'), 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center p-6 mt-10">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">QR Check-In</h2>

          {done ? (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-emerald-700 font-semibold text-lg">✅ Checked In!</p>
              <p className="text-emerald-600 text-sm mt-1">Redirecting to map...</p>
            </div>
          ) : msg && !desk ? (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">❌ {msg}</p>
            </div>
          ) : desk ? (
            <div className="mt-4">
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Desk</p>
                <p className="text-4xl font-black text-blue-600 mt-1">{desk.desk_name}</p>
                <div className="mt-3 flex justify-center">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    desk.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {desk.status === 'available' ? '● Available' : `● ${desk.status}`}
                  </span>
                </div>
              </div>

              {msg && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm font-medium">⚠️ {msg}</p>
                </div>
              )}

              {desk.status === 'available' ? (
                <button onClick={checkin} disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                  {loading ? 'Checking in...' : 'Check In Now'}
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm font-semibold">This desk is not available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm">Loading desk info...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
