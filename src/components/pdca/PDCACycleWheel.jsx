import { Target, Zap, ClipboardList, TrendingUp } from 'lucide-react';

const PHASES = [
  { key: 'plan', label: 'PLAN', icon: Target, color: '#3b82f6', light: '#eff6ff', desc: 'Lập kế hoạch' },
  { key: 'do', label: 'DO', icon: Zap, color: '#22c55e', light: '#f0fdf4', desc: 'Thực hiện' },
  { key: 'check', label: 'CHECK', icon: ClipboardList, color: '#f59e0b', light: '#fffbeb', desc: 'Kiểm tra' },
  { key: 'act', label: 'ACT', icon: TrendingUp, color: '#a855f7', light: '#faf5ff', desc: 'Cải tiến' },
];

export default function PDCACycleWheel({ activePhase, onSelect, completions = {} }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PHASES.map((p, i) => {
        const PhaseIcon = p.icon;
        const pct = completions[p.key] || 0;
        const isActive = activePhase === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            className="relative rounded-xl p-3 border-2 transition-all text-left hover:shadow-md"
            style={{
              borderColor: isActive ? p.color : '#e2e8f0',
              background: isActive ? p.light : 'white',
            }}
          >
            {/* Connector arrow (except last) */}
            {i < 3 && (
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 text-xs font-bold hidden sm:block">→</div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isActive ? p.color : '#f1f5f9' }}>
                <PhaseIcon className="w-3.5 h-3.5" style={{ color: isActive ? 'white' : p.color }} />
              </div>
              <span className="font-bold text-sm" style={{ color: p.color }}>{p.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{p.desc}</p>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
            </div>
            <p className="text-xs mt-1 font-semibold" style={{ color: p.color }}>{pct}%</p>
          </button>
        );
      })}
    </div>
  );
}

export { PHASES };