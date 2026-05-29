import { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: ReactNode;
  unit?: string;
  value: number | string;
  onValueChange?: (v: string) => void;
  width?: number | string;
  hint?: ReactNode;
}

/** A labelled input cell in inset-paper style with optional trailing unit. */
export function Field({
  label,
  unit,
  value,
  onValueChange,
  width,
  hint,
  type = 'text',
  ...rest
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1" style={{ width }}>
      {label !== undefined && (
        <span
          className="text-[11px] uppercase tracking-wider"
          style={{ color: 'var(--ink-muted)' }}
        >
          {label}
        </span>
      )}
      <span
        className="flex items-center"
        style={{
          background: 'var(--cream-card)',
          boxShadow: 'var(--shadow-bevel-in)',
          borderRadius: 3,
          padding: '2px 6px',
          minHeight: 22,
        }}
      >
        <input
          {...rest}
          type={type}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className="mono flex-1 bg-transparent outline-none border-none"
          style={{ color: 'var(--ink)', fontSize: 13, minWidth: 0 }}
        />
        {unit && (
          <span
            className="ml-1 text-[11px]"
            style={{ color: 'var(--ink-muted)' }}
          >
            {unit}
          </span>
        )}
      </span>
      {hint && (
        <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}
