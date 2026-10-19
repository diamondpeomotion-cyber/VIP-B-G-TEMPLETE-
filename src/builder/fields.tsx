import React from 'react';

/** Shared luxury form primitives (dark dashboard theme). */

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block mb-1.5">
      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold">{children}</span>
      {hint && <span className="block text-[10px] text-stone-600 font-mono mt-0.5 normal-case tracking-normal">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full bg-[#0a0a0b] text-sm border border-[#2a2a2d] rounded px-3 py-2.5 text-stone-200 outline-none focus:border-[#c5a059] transition placeholder:text-stone-600';

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${inputCls} resize-y ${props.className || ''}`} />;
}

export function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className || ''}`} />;
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      {children}
    </div>
  );
}

export function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#c5a059'}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-10 rounded bg-[#0a0a0b] border border-[#2a2a2d] cursor-pointer p-1"
        />
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#c5a059"
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

export function Card({
  title,
  subtitle,
  badge,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-[#121214] border border-[#2a2a2d] p-5 sm:p-6 rounded-lg ${className}`}>
      {(title || badge) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h3 className="text-lg font-serif italic text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{subtitle}</p>}
          </div>
          {badge}
        </div>
      )}
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`primary-action text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm transition inline-flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`secondary-action text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm transition inline-flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`ghost-action text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm transition inline-flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`danger-action text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-sm transition inline-flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Accessible toggle switch (role="switch", keyboard operable). Visuals come
 * from `.toggle-switch` in index.css; state is driven by `checked`.
 */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  size,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {(label || hint) && (
        <span className="min-w-0">
          {label && (
            <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-mono font-bold">
              {label}
            </span>
          )}
          {hint && <span className="block text-[10px] text-stone-600 font-mono mt-0.5">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`toggle-switch${size === 'sm' ? ' toggle-sm' : ''}`}
      />
    </div>
  );
}

export function Badge({
  children,
  tone = 'gold',
}: {
  children: React.ReactNode;
  tone?: 'gold' | 'green' | 'amber' | 'red' | 'stone' | 'blue';
}) {
  const tones: Record<string, string> = {
    gold: 'bg-[#c5a059]/10 border-[#c5a059]/30 text-[#c5a059]',
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    stone: 'bg-stone-500/10 border-stone-500/30 text-stone-400',
    blue: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 border rounded px-2 py-0.5 text-[9px] uppercase tracking-widest font-mono font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#2a2a2d] rounded-lg py-10 px-6 flex flex-col items-center justify-center text-center gap-2">
      {icon && <div className="text-[#c5a059] opacity-70 mb-1">{icon}</div>}
      <h4 className="font-serif italic text-white text-base">{title}</h4>
      <p className="text-xs text-stone-500 max-w-sm leading-relaxed">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
