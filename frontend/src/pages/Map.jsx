import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';

const STATUS_CONFIG = {
  available: {
    bg: 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/20',
    glow: 'glow-green',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
    label: 'Available',
  },
  occupied: {
    bg: 'bg-red-500/10 border-red-500/30',
    glow: 'glow-red',
    dot: 'bg-red-400',
    text: 'text-red-300',
    label: 'Occupied',
  },
  away: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    glow: 'glow-amber',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
    label: 'Away',
  },
  abandoned: {
    bg: 'bg-orange-500/10 border-orange-500/30',
    glow: 'glow-amber',
    dot: 'bg-orange-400',
    text: 'text-orange-300',
    label: 'Abandoned',
  },
};

export default function Map() {
  const [desks, setDesks] = useState([]);
  const [session, setSession] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [presenceAlert, setPresenceAlert] = useState(false);
  const [time, setTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    const [d, s] = await Promise.all([api.get('/desks'), api.get('/desks/my-session')]);
    setDesks(d.data);
    setSession(s.data);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(interval); clearInterval(clock); };
  }, [fetchData]);

  useEffect(() => {
    if (!session) return;
    const lastCheck = new Date(session.last_presence_check || session.checkin_time);
    if (Date.now() - lastCheck.getTime() > 1.9 * 60 * 60 * 1000) setPresenceAlert(true);
  }, [session]);

  async function act(endpoint) {
    setMsg('');
    try {
      const { data } = await api.post(`/desks/${endpoint}`);
      setMsg(data.message);
      setMsgType('success');
      setPresenceAlert(false);
      fetchData();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error');
      setMsgType('error');
    }
  }

  async function checkin(desk_id) {
    setMsg('');
    try {
      await api.post('/desks/checkin', { desk_id });
      setMsg('Checked in successfully!');
      setMsgType('success');
      fetchData();
    } catch (e) {
      setMsg(e.response?.data?.error || 'Error');
      setMsgType('error');
    }
  }

  const available = desks.filter(d => d.status === 'available').length;
  const occupied  = desks.filter(d => d.status === 'occupied').length;
  const away      = desks.filter(d => d.status === 'away').length;
  const pct       = desks.length ? Math.round((available / desks.length) * 100) : 0;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(135deg,#0f0c29,#1a1040,#0d1b4b)' }}>
      {/* ── Animated orbs ── */}
      <div className="orb orb-1 w-96 h-96 bg-indigo-600 top-[-80px] left-[-60px]" />
      <div className="orb orb-2 w-80 h-80 bg-violet-600 top-[30%] right-[-40px]" />
      <div className="orb orb-3 w-64 h-64 bg-cyan-500  bottom-[10%] left-[20%]" />
      <div className="orb orb-4 w-72 h-72 bg-purple-700 bottom-[-60px] right-[15%]" />

      {/* ── Dot grid overlay ── */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

        {/* ── Hero header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">
              📍 Live Floor View
            </p>
            <h1 className="text-4xl font-black text-white leading-tight">
              Library{' '}
              <span className="shimmer-text">Seat Map</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Real-time desk availability</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-white tabular-nums">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        {desks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Available', value: available, accent: '#10b981', shadow: 'rgba(16,185,129,0.35)', icon: '🟢' },
              { label: 'Occupied',  value: occupied,  accent: '#ef4444', shadow: 'rgba(239,68,68,0.35)',  icon: '🔴' },
              { label: 'Away',      value: away,       accent: '#f59e0b', shadow: 'rgba(245,158,11,0.35)', icon: '🟡' },
              { label: 'Open %',    value: `${pct}%`,  accent: '#818cf8', shadow: 'rgba(129,140,248,0.35)',icon: '📊' },
            ].map(({ label, value, accent, shadow, icon }) => (
              <div key={label}
                className="rounded-2xl border border-white/10 p-4 text-center backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.05)', boxShadow: `0 0 24px 4px ${shadow}` }}
              >
                <p className="text-2xl mb-1">{icon}</p>
                <p className="text-3xl font-black" style={{ color: accent }}>{value}</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Availability bar ── */}
        {desks.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 p-4 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-white">Seat Availability</span>
              <span>{pct}% free</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: pct > 50 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                               pct > 20 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' :
                                          'linear-gradient(90deg,#ef4444,#f87171)',
                  boxShadow: `0 0 10px ${pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444'}`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Toast ── */}
        {msg && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 border backdrop-blur-sm ${
            msgType === 'success' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' :
            'bg-red-500/10 border-red-500/40 text-red-300'
          }`}>
            {msgType === 'success' ? '✅' : '❌'} {msg}
          </div>
        )}

        {/* ── Presence alert ── */}
        {presenceAlert && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
            style={{ background: 'rgba(245,158,11,0.08)', boxShadow: '0 0 30px rgba(245,158,11,0.2)' }}>
            <div>
              <p className="font-bold text-amber-300 text-sm">⏰ Still there?</p>
              <p className="text-amber-400/80 text-xs mt-0.5">Confirm your presence or your desk will be auto-released.</p>
            </div>
            <button onClick={() => act('presence')}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-xl text-sm transition-all glow-amber whitespace-nowrap">
              I'm Here ✓
            </button>
          </div>
        )}

        {/* ── Active session card ── */}
        {session && (
          <div className="mb-8 rounded-2xl border border-indigo-500/30 p-5 backdrop-blur-md" style={{ background: 'rgba(99,102,241,0.08)' }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-semibold">Your Active Desk</p>
                <p className="text-5xl font-black text-white mt-1">{session.desk_name}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                session.status === 'active'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              }`}>
                {session.status === 'active' ? '● ACTIVE' : '● AWAY'}
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {session.status === 'active' && (<>
                <button onClick={() => act('away')}
                  className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105">
                  🚶 Go Away
                </button>
                <button onClick={() => act('presence')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105">
                  ✓ Still Here
                </button>
                <button onClick={() => act('checkout')}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105">
                  ✕ Check Out
                </button>
              </>)}
              {session.status === 'away' && (<>
                <button onClick={() => act('resume')}
                  className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105">
                  ↩ Resume
                </button>
                <button onClick={() => act('checkout')}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105">
                  ✕ Check Out
                </button>
              </>)}
            </div>
          </div>
        )}

        {/* ── Desk grid ── */}
        {desks.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-5xl mb-4">🪑</p>
            <p className="font-semibold text-slate-300">No desks yet</p>
            <p className="text-sm mt-1">Ask a librarian to add desks</p>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">
              {desks.length} Desks · Click to check in
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {desks.map((desk, i) => {
                const cfg = STATUS_CONFIG[desk.status] || STATUS_CONFIG.available;
                const isClickable = desk.status === 'available' && !session;
                return (
                  <div key={desk.desk_id}
                    onClick={() => isClickable && checkin(desk.desk_id)}
                    className={`desk-card rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 backdrop-blur-sm ${cfg.bg} ${
                      isClickable ? `cursor-pointer hover:scale-105 hover:-translate-y-1 ${cfg.glow}` : 'opacity-70'
                    }`}
                    style={{ animationDelay: `${i * 30}ms`, background: 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="font-black text-white text-base">{desk.desk_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      <span className={`text-xs font-semibold capitalize ${cfg.text}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="text-center text-slate-600 text-xs mt-10">
          🔄 Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}
