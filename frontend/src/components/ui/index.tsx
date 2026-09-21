import React, { useState, useRef, useEffect, ReactNode } from 'react';

// ============================================================
// ⚡ PREMIUM UI COMPONENT LIBRARY — THEME-AWARE (Light & Dark)
// ============================================================
export * from './charts';

export type ColorVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'dark';
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// ─────────────────────────────────────────────────────────────
// THEME TOKENS (both modes)
// ─────────────────────────────────────────────────────────────
const variantClasses: Record<ColorVariant, string> = {
  primary:   'bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0',
  secondary: 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-0.5 active:translate-y-0',
  success:   'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0',
  danger:    'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-500/25 hover:-translate-y-0.5 active:translate-y-0',
  warning:   'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0',
  info:      'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white shadow-md shadow-sky-500/25 hover:-translate-y-0.5 active:translate-y-0',
  ghost:     'bg-transparent border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-none',
  dark:      'bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 shadow-md shadow-slate-950/30 hover:-translate-y-0.5 active:translate-y-0',
};

const outlineVariantClasses: Record<ColorVariant, string> = {
  primary:   'border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-600',
  secondary: 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60',
  success:   'border border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-600',
  danger:    'border border-rose-500 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-600',
  warning:   'border border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-600',
  info:      'border border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 hover:border-sky-600',
  ghost:     'border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50',
  dark:      'border border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-800/20',
};

const badgeVariantClasses: Record<ColorVariant, string> = {
  primary:   'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/30',
  secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  success:   'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30',
  danger:    'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30',
  warning:   'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30',
  info:      'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/30',
  ghost:     'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/40',
  dark:      'bg-slate-900 text-white border border-slate-800',
};

const sizeClasses: Record<SizeVariant, string> = {
  xs: 'text-xs px-2.5 py-1',
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
  xl: 'text-base px-6 py-3',
};

// ─────────────────────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant; size?: SizeVariant; outline?: boolean; loading?: boolean;
  leftIcon?: ReactNode; rightIcon?: ReactNode; fullWidth?: boolean; pill?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', outline = false, loading = false,
  leftIcon, rightIcon, fullWidth, pill, children, className = '', disabled, ...rest
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  const radius = pill ? 'rounded-full' : 'rounded-xl';
  const width = fullWidth ? 'w-full' : '';
  const colorClass = outline ? outlineVariantClasses[variant] : variantClasses[variant];
  return (
    <button className={`${base} ${radius} ${width} ${sizeClasses[size]} ${colorClass} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// ICON BUTTON
// ─────────────────────────────────────────────────────────────
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant; size?: SizeVariant; outline?: boolean; tooltip?: string;
}
export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost', size = 'sm', outline = false, tooltip, children, className = '', ...rest
}) => {
  const p: Record<SizeVariant, string> = { xs: 'p-1', sm: 'p-1.5', md: 'p-2', lg: 'p-2.5', xl: 'p-3' };
  const colorClass = outline ? outlineVariantClasses[variant] : variantClasses[variant];
  return (
    <button title={tooltip} className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 disabled:opacity-50 ${p[size]} ${colorClass} ${className}`} {...rest}>
      {children}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────
interface BadgeProps { variant?: ColorVariant; size?: 'sm' | 'md'; dot?: boolean; pill?: boolean; children: ReactNode; className?: string; }
export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', size = 'sm', dot = false, pill = true, children, className = '' }) => {
  const sizeMap = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1' };
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${sizeMap[size]} ${pill ? 'rounded-full' : 'rounded-lg'} ${badgeVariantClasses[variant]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string; hover?: boolean; glass?: boolean; padding?: 'none' | 'sm' | 'md' | 'lg'; }
export const Card: React.FC<CardProps> = ({ children, className = '', hover = false, glass = false, padding = 'md' }) => {
  const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  const bg = glass
    ? 'bg-white/60 dark:bg-white/5 backdrop-blur-xl'
    : 'bg-white dark:bg-slate-800/60';
  const border = 'border border-gray-200 dark:border-slate-700/50';
  const hoverClass = hover ? 'hover:border-gray-300 dark:hover:border-slate-500/60 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300 cursor-pointer' : '';
  return (
    <div className={`rounded-2xl shadow-sm dark:shadow-xl ${bg} ${border} ${hoverClass} ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps { title: string; subtitle?: string; action?: ReactNode; icon?: ReactNode; }
export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, icon }) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-3">
      {icon && <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">{icon}</div>}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; icon?: ReactNode; change?: number; suffix?: string; color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'red' | 'cyan'; loading?: boolean; }
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change, suffix = '', color = 'blue', loading = false }) => {
  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/10',    text: 'text-blue-600 dark:text-blue-400',    glow: 'shadow-blue-100 dark:shadow-blue-500/10' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-100 dark:shadow-emerald-500/10' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-500/10',  text: 'text-violet-600 dark:text-violet-400',  glow: 'shadow-violet-100 dark:shadow-violet-500/10' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   glow: 'shadow-amber-100 dark:shadow-amber-500/10' },
    red:     { bg: 'bg-red-50 dark:bg-red-500/10',      text: 'text-red-600 dark:text-red-400',      glow: 'shadow-red-100 dark:shadow-red-500/10' },
    cyan:    { bg: 'bg-cyan-50 dark:bg-cyan-500/10',    text: 'text-cyan-600 dark:text-cyan-400',    glow: 'shadow-cyan-100 dark:shadow-cyan-500/10' },
  };
  const c = colorMap[color];
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 p-5 shadow-sm dark:shadow-xl ${c.glow}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
          {loading ? <div className="h-8 w-24 bg-gray-100 dark:bg-slate-700/50 rounded-lg animate-pulse mt-2" /> : (
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}<span className="text-base font-medium text-gray-400 dark:text-slate-400 ml-1">{suffix}</span></p>
          )}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>{change >= 0 ? '▲' : '▼'} {Math.abs(change)}%</span>
              <span className="text-gray-400 dark:text-slate-500 font-normal">vs last period</span>
            </div>
          )}
        </div>
        {icon && <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.bg} ${c.text} shrink-0`}>{icon}</div>}
      </div>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${c.bg} opacity-30 blur-xl`} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string; leftIcon?: ReactNode; rightIcon?: ReactNode; wrapperClass?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, leftIcon, rightIcon, wrapperClass = '', className = '', ...rest
}, ref) => (
  <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
    {label && <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
    <div className="relative">
      {leftIcon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400">{leftIcon}</span>}
      <input
        ref={ref}
        className={`w-full bg-white dark:bg-slate-900/70 border ${error ? 'border-red-400 dark:border-red-500/70 focus:ring-red-200 dark:focus:ring-red-500/30' : 'border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/25'} rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 py-2.5 ${leftIcon ? 'pl-10' : 'pl-4'} ${rightIcon ? 'pr-10' : 'pr-4'} disabled:bg-slate-50 dark:disabled:bg-slate-800/40 disabled:cursor-not-allowed ${className}`}
        {...rest}
      />
      {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400">{rightIcon}</span>}
    </div>
    {error && <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">⚠ {error}</p>}
    {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
  </div>
));
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────
// TEXTAREA
// ─────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string; hint?: string; wrapperClass?: string; }
export const Textarea: React.FC<TextareaProps> = ({ label, error, hint, wrapperClass = '', className = '', ...rest }) => (
  <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
    {label && <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
    <textarea
      className={`w-full bg-white dark:bg-slate-900/70 border ${error ? 'border-red-400 dark:border-red-500/70' : 'border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/25'} rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 py-2.5 px-4 resize-none ${className}`}
      rows={4} {...rest}
    />
    {error && <p className="text-xs text-rose-500 dark:text-rose-400">⚠ {error}</p>}
    {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; hint?: string; options: { value: string | number; label: string }[]; placeholder?: string; wrapperClass?: string;
}
export const Select: React.FC<SelectProps> = ({ label, error, hint, options, placeholder, wrapperClass = '', className = '', ...rest }) => (
  <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
    {label && <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
    <select
      className={`w-full bg-white dark:bg-slate-900/70 border ${error ? 'border-red-400 dark:border-red-500/70' : 'border-slate-300 dark:border-slate-700/80 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-500/25'} rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all duration-200 py-2.5 px-4 appearance-none cursor-pointer ${className}`}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-rose-500 dark:text-rose-400">⚠ {error}</p>}
    {hint && !error && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// CHECKBOX & RADIO
// ─────────────────────────────────────────────────────────────
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; }
export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...rest }) => (
  <label className="inline-flex items-center gap-2.5 cursor-pointer group">
    <input type="checkbox" className={`w-4 h-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-100 dark:focus:ring-blue-500/30 cursor-pointer ${className}`} {...rest} />
    {label && <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>}
  </label>
);

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; }
export const Radio: React.FC<RadioProps> = ({ label, className = '', ...rest }) => (
  <label className="inline-flex items-center gap-2.5 cursor-pointer group">
    <input type="radio" className={`w-4 h-4 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-600 focus:ring-blue-100 dark:focus:ring-blue-500/30 cursor-pointer ${className}`} {...rest} />
    {label && <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>}
  </label>
);

// ─────────────────────────────────────────────────────────────
// TOGGLE / SWITCH
// ─────────────────────────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; size?: 'sm' | 'md'; color?: 'blue' | 'emerald' | 'violet'; }
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, size = 'md', color = 'blue' }) => {
  const colorMap = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500' };
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  };
  const s = sizes[size];
  return (
    <button onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 group" type="button">
      <div className={`relative flex-shrink-0 ${s.track} rounded-full transition-colors duration-300 ${checked ? colorMap[color] : 'bg-gray-300 dark:bg-slate-700'}`}>
        <div className={`absolute top-0.5 left-0.5 ${s.thumb} bg-white rounded-full shadow transition-transform duration-300 ${checked ? s.translate : 'translate-x-0'}`} />
      </div>
      {label && <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────────────────────────
interface SearchInputProps { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; }
export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
    </svg>
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-white dark:bg-slate-900/60 border border-gray-300 dark:border-slate-700/70 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500/70 py-2.5 pl-10 pr-10 transition-all"
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────
interface PaginationProps { current: number; total: number; pageSize?: number; onChange: (page: number) => void; }
export const Pagination: React.FC<PaginationProps> = ({ current, total, pageSize = 10, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
    if (current < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  const base = 'w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center';
  const inactive = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500';
  const active   = 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-500/30';
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(current - 1)} disabled={current === 1} className={`${base} ${inactive} disabled:opacity-40 disabled:cursor-not-allowed`}>‹</button>
      {pages.map((p, i) => p === '...'
        ? <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-slate-500">…</span>
        : <button key={p} onClick={() => onChange(p as number)} className={`${base} ${current === p ? active : inactive}`}>{p}</button>
      )}
      <button onClick={() => onChange(current + 1)} disabled={current === totalPages} className={`${base} ${inactive} disabled:opacity-40 disabled:cursor-not-allowed`}>›</button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TABLE
// ─────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string; label: string; render?: (row: T, index: number) => ReactNode;
  sortable?: boolean; width?: string; align?: 'left' | 'center' | 'right';
}
interface TableProps<T> {
  columns: Column<T>[]; data: T[]; loading?: boolean; emptyText?: string;
  onRowClick?: (row: T) => void; rowKey?: keyof T; stickyHeader?: boolean;
  sortKey?: string; sortDir?: 'asc' | 'desc'; onSort?: (key: string) => void;
}
export function Table<T extends Record<string, any>>({
  columns, data, loading, emptyText = 'No records found',
  onRowClick, rowKey, stickyHeader, sortKey, sortDir, onSort
}: TableProps<T>) {
  const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' };
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700/50">
      <table className="w-full text-sm">
        <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-gray-50 dark:bg-slate-900/80 backdrop-blur-sm`}>
          <tr>
            {columns.map(col => (
              <th key={String(col.key)} style={{ width: col.width }}
                className={`px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest border-b border-gray-200 dark:border-slate-700/50 ${alignMap[col.align || 'left']} ${col.sortable ? 'cursor-pointer hover:text-gray-900 dark:hover:text-white select-none' : ''}`}
                onClick={() => col.sortable && onSort?.(String(col.key))}>
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  {col.sortable && sortKey === String(col.key) && <span className="text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-slate-800/50">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3.5">
                    <div className="h-4 bg-gray-100 dark:bg-slate-700/50 rounded-lg animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-gray-400 dark:text-slate-500">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-12 h-12 text-gray-200 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm">{emptyText}</span>
              </div>
            </td></tr>
          ) : data.map((row, i) => (
            <tr key={rowKey ? String(row[rowKey]) : i} onClick={() => onRowClick?.(row)}
              className={`border-b border-gray-100 dark:border-slate-800/50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-700/30' : 'hover:bg-gray-50 dark:hover:bg-slate-800/30'} ${i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-slate-900/20'}`}>
              {columns.map(col => (
                <td key={String(col.key)} className={`px-4 py-3.5 text-gray-700 dark:text-slate-300 ${alignMap[col.align || 'left']}`}>
                  {col.render ? col.render(row, i) : row[String(col.key)]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title?: string; size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; children: ReactNode; footer?: ReactNode; }
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, size = 'md', children, footer }) => {
  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-5xl' };
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeMap[size]} bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 shrink-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700/50 shrink-0 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DROPDOWN MENU
// ─────────────────────────────────────────────────────────────
interface DropdownItem { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; divider?: boolean; disabled?: boolean; }
interface DropdownMenuProps { trigger: ReactNode; items: DropdownItem[]; align?: 'left' | 'right'; }
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div className={`absolute mt-2 ${align === 'right' ? 'right-0' : 'left-0'} w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/60 rounded-xl shadow-xl dark:shadow-2xl z-50 py-1.5 overflow-hidden`}>
          {items.map((item, i) => (
            <div key={i}>
              {item.divider && i > 0 && <div className="my-1 border-t border-gray-100 dark:border-slate-700/50" />}
              <button onClick={() => { if (!item.disabled) { item.onClick(); setOpen(false); } }} disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${item.danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'} ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                {item.icon && <span className="w-4 h-4 flex items-center justify-center opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
interface ToastItem { id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; }
interface ToastContainerProps { toasts: ToastItem[]; onRemove: (id: string) => void; }
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  const typeMap = {
    success: { icon: '✓', cls: 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-500/50', text: 'text-emerald-600 dark:text-emerald-400' },
    error:   { icon: '✕', cls: 'bg-white dark:bg-slate-800 border-red-300 dark:border-red-500/50',         text: 'text-red-600 dark:text-red-400' },
    warning: { icon: '⚠', cls: 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-500/50',     text: 'text-amber-600 dark:text-amber-400' },
    info:    { icon: 'ℹ', cls: 'bg-white dark:bg-slate-800 border-blue-300 dark:border-blue-500/50',       text: 'text-blue-600 dark:text-blue-400' },
  };
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => {
        const m = typeMap[t.type];
        return (
          <div key={t.id} className={`w-80 rounded-xl border shadow-xl backdrop-blur-sm ${m.cls} p-4 flex gap-3`}>
            <span className={`text-lg leading-none mt-0.5 ${m.text}`}>{m.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t.title}</p>
              {t.message && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => onRemove(t.id)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const add = (toast: Omit<ToastItem, 'id'>, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };
  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  return {
    toasts, remove,
    success: (t: string, m?: string) => add({ type: 'success', title: t, message: m }),
    error:   (t: string, m?: string) => add({ type: 'error',   title: t, message: m }),
    warning: (t: string, m?: string) => add({ type: 'warning', title: t, message: m }),
    info:    (t: string, m?: string) => add({ type: 'info',    title: t, message: m }),
  };
}

// ─────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────
interface TabItem { key: string; label: string; icon?: ReactNode; count?: number; }
interface TabsProps { tabs: TabItem[]; active: string; onChange: (key: string) => void; variant?: 'line' | 'pill'; }
export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, variant = 'line' }) => {
  if (variant === 'pill') {
    return (
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700/50 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${active === t.key ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}>
            {t.icon}{t.label}
            {t.count !== undefined && <Badge variant={active === t.key ? 'ghost' : 'secondary'} size="sm">{t.count}</Badge>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0 border-b border-gray-200 dark:border-slate-700/50">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${active === t.key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>
          {t.icon}{t.label}
          {t.count !== undefined && <Badge variant={active === t.key ? 'primary' : 'secondary'} size="sm">{t.count}</Badge>}
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────
interface ProgressBarProps { value: number; max?: number; color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'red'; size?: 'sm' | 'md' | 'lg'; label?: string; showValue?: boolean; }
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, color = 'blue', size = 'md', label, showValue = false }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = { blue: 'from-blue-500 to-indigo-500', emerald: 'from-emerald-500 to-teal-500', violet: 'from-violet-500 to-purple-500', amber: 'from-amber-500 to-orange-500', red: 'from-red-500 to-rose-500' };
  const sizeMap = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-slate-400">{label}</span>
          <span className="text-xs text-gray-500 dark:text-slate-400">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 dark:bg-slate-800 rounded-full ${sizeMap[size]} overflow-hidden`}>
        <div className={`${sizeMap[size]} bg-gradient-to-r ${colorMap[color]} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────
interface SkeletonProps { width?: string; height?: string; className?: string; rounded?: string; }
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = '1rem', className = '', rounded = 'rounded-lg' }) => (
  <div className={`animate-pulse bg-gray-100 dark:bg-slate-700/50 ${rounded} ${className}`} style={{ width, height }} />
);

// ─────────────────────────────────────────────────────────────
// DIVIDER
// ─────────────────────────────────────────────────────────────
interface DividerProps { label?: string; className?: string; }
export const Divider: React.FC<DividerProps> = ({ label, className = '' }) => (
  <div className={`relative flex items-center my-4 ${className}`}>
    <div className="flex-grow border-t border-gray-200 dark:border-slate-700/50" />
    {label && <span className="px-4 text-xs text-gray-400 dark:text-slate-500 shrink-0">{label}</span>}
    {label && <div className="flex-grow border-t border-gray-200 dark:border-slate-700/50" />}
  </div>
);

// ─────────────────────────────────────────────────────────────
// ALERT BANNER
// ─────────────────────────────────────────────────────────────
interface AlertBannerProps { type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; onClose?: () => void; }
export const AlertBanner: React.FC<AlertBannerProps> = ({ type, title, message, onClose }) => {
  const typeMap = {
    success: { cls: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10', icon: '✓', text: 'text-emerald-700 dark:text-emerald-400' },
    error:   { cls: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10',                 icon: '✕', text: 'text-red-700 dark:text-red-400' },
    warning: { cls: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10',         icon: '⚠', text: 'text-amber-700 dark:text-amber-400' },
    info:    { cls: 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10',             icon: 'ℹ', text: 'text-blue-700 dark:text-blue-400' },
  };
  const m = typeMap[type];
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${m.cls}`}>
      <span className={`text-lg leading-none mt-0.5 ${m.text}`}>{m.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-bold ${m.text}`}>{title}</p>
        {message && <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────
interface AvatarProps { src?: string; name?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; status?: 'online' | 'offline' | 'away'; }
export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', status }) => {
  const sizeMap = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const dotMap  = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3', xl: 'w-3.5 h-3.5' };
  const statusColor = status === 'online' ? 'bg-emerald-400' : status === 'away' ? 'bg-amber-400' : 'bg-gray-400 dark:bg-slate-500';
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  return (
    <div className="relative inline-flex shrink-0">
      <div className={`${sizeMap[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white border-2 border-gray-200 dark:border-slate-700`}>
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <span>{initials}</span>}
      </div>
      {status && <span className={`absolute bottom-0 right-0 ${dotMap[size]} rounded-full ${statusColor} border-2 border-white dark:border-slate-900`} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
interface EmptyStateProps { icon?: ReactNode; title: string; description?: string; action?: ReactNode; }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    {icon && <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mb-4">{icon}</div>}
    <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; actions?: ReactNode; breadcrumb?: { label: string; href?: string }[]; }
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      {breadcrumb && (
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 mb-1.5">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {b.href ? <a href={b.href} className="hover:text-gray-700 dark:hover:text-slate-300 transition-colors">{b.label}</a> : <span className="text-gray-600 dark:text-slate-400">{b.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// ERROR LOG MODAL (Extremely Premium)
// ─────────────────────────────────────────────────────────────
export interface ErrorLogItem {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  message: string;
  stack?: string;
}

interface ErrorLogModalProps {
  open: boolean;
  onClose: () => void;
  logs: ErrorLogItem[];
  onClear?: () => void;
}

export const ErrorLogModal: React.FC<ErrorLogModalProps> = ({ open, onClose, logs, onClear }) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="System Exception Logs"
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Dismiss</Button>
          {onClear && <Button variant="danger" outline onClick={onClear}>Clear Logs</Button>}
        </>
      }
    >
      <div className="space-y-4">
        {logs.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="System Healthy"
            description="No error logs have been recorded during this session."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map(log => {
              const isSelected = selectedLogId === log.id;
              const statusColor = log.status >= 500 ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20';

              return (
                <div key={log.id} className={`rounded-xl border transition-all duration-200 overflow-hidden ${isSelected ? 'border-red-500/50 shadow-lg shadow-red-500/5' : 'border-gray-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50'}`}>
                  <div
                    className="p-4 cursor-pointer flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                  >
                    <div className={`mt-0.5 px-2.5 py-1 text-xs font-bold font-mono rounded-lg border flex-shrink-0 ${statusColor}`}>
                      {log.status}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 font-mono tracking-wider">{log.method}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{log.endpoint}</span>
                        <span className="ml-auto text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">{log.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 truncate font-mono">{log.message}</p>
                    </div>
                    <div className="flex-shrink-0 mt-2 text-gray-400">
                      <svg className={`w-5 h-5 transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {isSelected && log.stack && (
                    <div className="p-4 bg-gray-50 dark:bg-slate-900/80 border-t border-gray-100 dark:border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Stack Trace</span>
                        <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(log.stack || ''); }}>Copy</Button>
                      </div>
                      <pre className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-4 overflow-x-auto">
                        <code>{log.stack}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
