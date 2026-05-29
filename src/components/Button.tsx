import { ButtonHTMLAttributes, ReactNode, useState } from 'react';
import { clsx } from '../util/clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const padding =
    size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? 12 : 13;

  const bg =
    variant === 'primary'
      ? 'var(--accent-warm)'
      : variant === 'ghost'
        ? 'transparent'
        : 'var(--cream-panel)';
  const color = variant === 'primary' ? 'var(--cream-card)' : 'var(--ink)';

  return (
    <button
      {...rest}
      onPointerDown={(e) => {
        setPressed(true);
        rest.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        setPressed(false);
        rest.onPointerUp?.(e);
      }}
      onPointerLeave={(e) => {
        setPressed(false);
        rest.onPointerLeave?.(e);
      }}
      className={clsx('inline-flex items-center justify-center gap-1.5', className)}
      style={{
        background: bg,
        color,
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: 3,
        boxShadow:
          variant === 'ghost'
            ? 'none'
            : pressed
              ? 'var(--shadow-bevel-in)'
              : 'var(--shadow-bevel-out)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
