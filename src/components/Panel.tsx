import { ReactNode } from 'react';
import { clsx } from '../util/clsx';

interface PanelProps {
  children: ReactNode;
  inset?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** A small card / well — either raised (default) or inset (for input groups). */
export function Panel({ children, inset, className, style }: PanelProps) {
  return (
    <div
      className={clsx(className)}
      style={{
        background: inset ? 'var(--cream-inset)' : 'var(--cream-card)',
        boxShadow: inset ? 'var(--shadow-bevel-in)' : 'var(--shadow-bevel-out)',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--pad-md)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
