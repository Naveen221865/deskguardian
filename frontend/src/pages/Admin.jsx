import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

function timeSince(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

const STAT_CONFIG = [
  { key: 'total',     label: 'Total Desks', icon: '🪑', accent: '#818cf8', shadow: 'rgba(129,140,248,0.4)',  glow: 'glow-indigo' },
  { key: 'available', label: 'Available',   icon: '✅', accent: '#10b981', shadow: 'rgba(16,185,129,0.4)',   glow: 'glow-green'  },
  { key: 'occupied',  label: 'Occupied',    icon: '🔴', accent: '#ef4444', shadow: 'rgba(239,68,68,0.4)',    glow: 'glow-red'    },
  { key: 'away',      label: 'Away',        icon: '🟡', accent: '#f59e0b', shadow: 'rgba(245,158,11,0.4)',   glow: 'glow-amber'  },
];

const STATUS_CONFIG = {
  available: { bg: 'bg-emerald-500/10 border-emerald-500/40', glow: 'glow-green', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  occupied:  { bg: 'bg-red-500/10 border-red-500/30', glow: 'glow-red', dot: 'bg-red-400', text: 'text-red-300' },
  away:      { bg: 'bg-amber-500/10 border-amber-500/30', glow: 'glow-amber', dot: 'bg-amber-400', text: 'text-amber-300' },
  abandoned: { bg: 'bg-orange-500/10 border-orange-500/30', glow: 'glow-amber', dot: 'bg-orange-400', text: 'text-orange-300' },
};

export default function Admin() {
  const [stats, setStats] = useState({});
  const [sessions, setSessions] = useState([]);
  const [abandoned, setAbandoned] = useState([]);
  const [desks, setDesks] = useState([]);
  const [newDesk, setNewDesk] = useState('');
  const [qrImg, setQrImg] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [time, setTime] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  const fetchData = useCallback(async () => {
    const [s, ss, ab, d] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/sessions'),
      api.get('/admin/abandoned'),
      api.get('/desks')
    ]);
    setStats(s.data);
    setSessions(ss.data);
    setAbandoned(ab.data);
    setDesks(d.data);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 15000);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(t); clearInterval(clock); };
  }, [fetchData]);

  async function forceCheckout(session_id) {
    await api.post(`/admin/force-checkout/${session_id}`);
    fetchData();
  }

  async function resetAbandoned(session_id) {
    await api.post(`/admin/reset-abandoned/${session_id}`);
    fetchData();
  }

  async function addDesk(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/desks', { desk_name: newDesk });
      setQrImg(data.qr_image);
      setNewDesk('');
      setMsg(`Desk "${data.desk_name}" added`);
      setMsgType('success');
      fetchData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error');
      setMsgType('error');
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg,#020617,#0f0a1e,#060d1f)' }}>

      {/* Orbs */}
      <div className="orb orb-1 w-[500px] h-[500px] bg-violet-700 top-[-120px] left-[-100px]" />
      <div className="orb orb-2 w-80 h-80 bg-indigo-600 top-[40%] right-[-60px]" />
      <div className="orb orb-3 w-72 h-72 bg-cyan-600 bottom-0 left-[30%]" />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1">
              ⚡ Control Center
            </p>
            <h1 className="text-4xl font-black text-white">
              Librarian{' '}
              <span className="shimmer-text">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage desks · Monitor sessions · Live floor view</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white tabular-nums">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${pulse ? 'scale-150' : ''} transition-transform`} />
              <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {STAT_CONFIG.map(({ key, label, icon, accent, shadow, glow }) => (
            <div key={key}
              className={`rounded-2xl border border-white/10 p-5 backdrop-blur-md text-center ${glow}`}
              style={{ background: 'rgba(255,255,255,0.04)', boxShadow: `0 0 28px 6px ${shadow}` }}>
              <p className="text-3xl mb-2">{icon}</p>
              <p className="text-4xl font-black" style={{ color: accent }}>
                {stats[key] ?? 0}
              </p>
              <p className="text-slate-400 text-xs mt-1.5 font-semibold uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Occupancy bar ── */}
        {(stats.total > 0) && (
          <div className="mb-8 rounded-2xl border border-white/10 p-5 backdrop-blur-md"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex justify-between text-xs mb-3">
              <span className="text-white font-bold">Occupancy Rate</span>
              <span className="text-slate-400">
                {stats.occupied}/{stats.total} desks occupied
              </span>
            </div>
            <div className="h-4 rounded-full bg-white/10 overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{
                  width: `${Math.round(((stats.occupied || 0) / stats.total) * 100)}%`,
                  background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#c084fc)',
                  boxShadow: '0 0 12px #8b5cf6',
                }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
            <p className="text-right text-xs text-slate-500 mt-1.5">
              {Math.round(((stats.occupied || 0) / stats.total) * 100)}% full
            </p>
          </div>
        )}

        {/* ── Add Desk ── */}
        <div className="rounded-2xl border border-white/10 p-6 mb-8 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">➕</span> Add New Desk
          </h3>
          <form onSubmit={addDesk} className="flex gap-3">
            <input
              value={newDesk}
              onChange={e => setNewDesk(e.target.value)}
              placeholder="e.g. A-16"
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              required
            />
            <button
              className="px-6 py-3 rounded-xl text-sm font-black text-white transition-all hover:scale-105 glow-indigo"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Add Desk
            </button>
          </form>

          {msg && (
            <div className={`mt-4 text-sm font-semibold px-4 py-3 rounded-xl border flex items-center gap-2 ${
              msgType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}>
              {msgType === 'success' ? '✅' : '❌'} {msg}
            </div>
          )}

          {qrImg && (
            <div className="mt-5 flex items-start gap-5 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="relative">
                <img src={qrImg} alt="QR" className="w-32 h-32 rounded-xl border-2 border-indigo-500/50" />
                <div className="absolute inset-0 rounded-xl glow-indigo pointer-events-none" />
              </div>
              <div className="flex flex-col justify-center gap-2">
                <p className="text-white font-bold">QR Code Ready</p>
                <p className="text-slate-400 text-xs">Print and stick on the desk</p>
                <a href={qrImg} download="desk-qr.png"
                  className="inline-flex items-center gap-2 text-xs font-black text-white px-4 py-2 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  ⬇ Download QR
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ── Desk Floor Map ── */}
        <div className="mb-8">
          <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">🗺️</span> Live Desk Map
          </h3>
          {desks.length === 0 ? (
            <div className="text-center py-16 text-slate-600 rounded-2xl border border-white/10 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-4xl mb-3">🪑</p>
              <p className="font-semibold text-slate-400">No desks added yet</p>
              <p className="text-xs mt-1">Add your first desk above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {desks.map((desk, i) => {
                const cfg = STATUS_CONFIG[desk.status] || STATUS_CONFIG.available;
                return (
                  <div key={desk.desk_id}
                    className={`desk-card rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 backdrop-blur-sm ${cfg.bg} ${cfg.glow}`}
                    style={{ animationDelay: `${i * 30}ms`, background: 'rgba(255,255,255,0.04)' }}>
                    <span className="font-black text-white text-base">{desk.desk_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-xs font-semibold capitalize ${cfg.text}`}>{desk.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sessions table ── */}
        <div className="rounded-2xl border border-white/10 overflow-hidden backdrop-blur-md scanline-wrap"
          style={{ background: 'rgba(255,255,255,0.03)' }}>

          <div className="px-6 py-4 flex items-center justify-between border-b border-white/10"
            style={{ background: 'rgba(99,102,241,0.1)' }}>
            <h3 className="font-black text-white flex items-center gap-2 text-lg">
              <span>👥</span> Active Sessions
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                {sessions.length} Live
              </span>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <p className="text-4xl mb-3">🪑</p>
              <p className="font-semibold text-slate-400">No active sessions</p>
              <p className="text-xs mt-1 text-slate-600">Library is empty</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['Desk', 'Student', 'Roll No', 'Status', 'Checked In', 'Last Seen', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={s.session_id}
                      className="border-t border-white/5 transition-all duration-200 hover:bg-indigo-500/5"
                      style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="px-4 py-3.5">
                        <span className="font-black text-white text-base">{s.desk_name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 font-semibold">{s.student_name}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded-lg">
                          {s.roll_no}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                          s.status === 'active'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        }`}>
                          {s.status === 'active' ? '● ACTIVE' : '● AWAY'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{timeSince(s.checkin_time)}</td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{timeSince(s.last_presence_check)}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => forceCheckout(s.session_id)}
                          className="text-xs font-black px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all">
                          ⚡ Force Out
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Abandoned Sessions Panel ── */}
        <div className="mt-8 rounded-2xl border border-orange-500/30 overflow-hidden backdrop-blur-md"
          style={{ background: 'rgba(255,255,255,0.03)' }}>

          <div className="px-6 py-4 flex items-center justify-between border-b border-orange-500/20"
            style={{ background: 'rgba(249,115,22,0.08)' }}>
            <h3 className="font-black text-white flex items-center gap-2 text-lg">
              <span>🚨</span> Abandoned Desks
            </h3>
            <span className="text-xs font-black text-orange-400 uppercase tracking-widest">
              {abandoned.length} Record{abandoned.length !== 1 ? 's' : ''}
            </span>
          </div>

          {abandoned.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-slate-400 text-sm">No abandoned sessions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {['Desk', 'Student', 'Roll No', 'Reason', 'Checked In', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {abandoned.map((s, i) => (
                    <tr key={s.session_id}
                      className="border-t border-white/5 hover:bg-orange-500/5 transition-colors"
                      style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="px-4 py-3.5">
                        <span className="font-black text-white text-base">{s.desk_name}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 font-semibold">{s.student_name}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded-lg">{s.roll_no}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-orange-500/15 border-orange-500/40 text-orange-400">
                          {s.away_start ? '⏰ Away Timeout' : '👻 No Presence'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">{timeSince(s.checkin_time)}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => resetAbandoned(s.session_id)}
                          className="text-xs font-black px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 transition-all">
                          ✓ Acknowledge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs mt-5">
          ⚡ Auto-refreshes every 15 seconds · DeskGuard Control Center
        </p>
      </div>
    </div>
  );
}
