interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  emphasis?: 'normal' | 'warn' | 'good';
  onExplain?: () => void;
}

export function Stat({ label, value, unit, emphasis = 'normal', onExplain }: StatProps) {
  const color =
    emphasis === 'warn'
      ? 'var(--warn)'
      : emphasis === 'good'
        ? 'var(--accent-moss)'
        : 'var(--ink)';
  return (
    <div
      className="flex flex-col gap-0.5"
      style={{
        background: 'var(--cream-card)',
        boxShadow: 'var(--shadow-bevel-in)',
        padding: '6px 10px',
        borderRadius: 3,
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase tracking-wider"
          style={{ color: 'var(--ink-muted)' }}
        >
          {label}
        </span>
        {onExplain && (
          <button
            onClick={onExplain}
            title="Explain this number"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              fontSize: 11,
              padding: 0,
            }}
          >
            ?
          </button>
        )}
      </div>
      <div className="mono" style={{ color, fontSize: 16, fontWeight: 600 }}>
        {value}
        {unit && (
          <span
            className="ml-1"
            style={{ color: 'var(--ink-muted)', fontSize: 11, fontWeight: 400 }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
