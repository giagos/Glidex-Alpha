import { ReactNode } from 'react';

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  tabs: { id: T; label: ReactNode; icon?: ReactNode }[];
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  orientation = 'horizontal',
}: TabsProps<T>) {
  const isV = orientation === 'vertical';
  return (
    <div
      className={isV ? 'flex flex-col gap-0.5' : 'flex flex-row gap-0.5'}
      style={{
        padding: 4,
        background: 'var(--cream-panel)',
        boxShadow: 'var(--shadow-bevel-out)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex items-center gap-2 px-3 py-1.5 text-[13px]"
            style={{
              background: active ? 'var(--cream-card)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-muted)',
              boxShadow: active ? 'var(--shadow-bevel-in)' : 'none',
              borderRadius: 3,
              minWidth: isV ? 140 : undefined,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              justifyContent: isV ? 'flex-start' : 'center',
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
