import { ReactNode, useState, useRef, useEffect } from 'react';
import { clsx } from '../util/clsx';

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface MenuProps {
  label: string;
  items: MenuItem[];
}

export function Menu({ label, items }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    return () => window.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={clsx('px-2 py-0.5 text-[13px]')}
        style={{
          background: open ? 'var(--accent-warm)' : 'transparent',
          color: open ? 'var(--cream-card)' : 'var(--ink)',
          borderRadius: 2,
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      {open && (
        <div
          className="absolute z-50 mt-0.5"
          style={{
            background: 'var(--cream-panel)',
            boxShadow: 'var(--shadow-bevel-out)',
            minWidth: 180,
            padding: 3,
            borderRadius: 3,
          }}
        >
          {items.map((it, i) =>
            it.separator ? (
              <div
                key={i}
                style={{
                  height: 1,
                  background: 'var(--bevel-lo)',
                  margin: '3px 2px',
                  boxShadow: '0 1px 0 var(--bevel-hi)',
                }}
              />
            ) : (
              <button
                key={i}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                }}
                className="block w-full text-left px-2 py-1 text-[13px] rounded-sm"
                style={{
                  color: 'var(--ink)',
                  background: 'transparent',
                  cursor: it.disabled ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (it.disabled) return;
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-warm)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--cream-card)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
                }}
              >
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function MenuBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-1 px-2"
      style={{
        background: 'var(--cream-panel)',
        borderBottom: '1px solid var(--border-dark)',
        boxShadow: 'inset 0 1px 0 var(--bevel-hi)',
        height: 28,
      }}
    >
      {children}
    </div>
  );
}
