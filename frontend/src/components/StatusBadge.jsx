const styles = {
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  occupied: 'bg-red-50 text-red-700 border border-red-200',
  away: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const icons = {
  available: '●',
  occupied: '●',
  away: '●',
};

const dotColors = {
  available: 'text-emerald-500',
  occupied: 'text-red-500',
  away: 'text-amber-500',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
      <span className={`text-[8px] ${dotColors[status] || 'text-slate-400'}`}>{icons[status] || '●'}</span>
      {status}
    </span>
  );
}
