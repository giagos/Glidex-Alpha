import { ReactNode } from 'react';
import { clsx } from '../util/clsx';

interface WindowProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  toolbar?: ReactNode;
}

/** Platinum-style bordered window with a beveled title bar. */
export function Window({ title, children, className, bodyClassName, toolbar }: WindowProps) {
  return (
    <div
      className={clsx('flex flex-col', className)}
      style={{
        background: 'var(--cream-panel)',
        boxShadow: 'var(--shadow-bevel-out)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      {title !== undefined && (
        <div
          className="titlebar flex items-center select-none"
          style={{
            padding: '4px 8px',
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '0.01em',
          }}
        >
          <span className="flex-1 truncate">{title}</span>
          {toolbar}
        </div>
      )}
      <div
        className={clsx('flex-1 min-h-0 overflow-auto', bodyClassName)}
        style={{ padding: 'var(--pad-md)' }}
      >
        {children}
      </div>
    </div>
  );
}
