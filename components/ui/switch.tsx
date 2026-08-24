'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'checked' | 'onChange' | 'disabled' | 'className' | 'onClick'
>;

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'default',
  className,
  ...rest
}: SwitchProps) {
  const handleClick = () => {
    if (disabled) return;
    onCheckedChange(!checked);
  };

  const dimensions =
    size === 'sm' ? { width: 32, height: 18 } : { width: 40, height: 20 };
  const thumbDimensions = size === 'sm' ? 14 : 16;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={handleClick}
      {...rest}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        minWidth: dimensions.width,
        maxWidth: dimensions.width,
        minHeight: dimensions.height,
        maxHeight: dimensions.height,
      }}
      className={cn(
        'group relative inline-flex shrink-0 items-center rounded-full border outline-none transition-colors duration-200 ease-out',
        'border-white/10 bg-white/[0.06] shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]',
        'hover:border-white/20 hover:bg-white/[0.08]',
        'data-[state=checked]:border-emerald-400/50 data-[state=checked]:bg-emerald-500',
        'data-[state=checked]:shadow-[0_0_0_3px_rgb(16_185_129/0.15),inset_0_1px_2px_rgb(0_0_0/0.2)]',
        'focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      data-state={checked ? 'checked' : 'unchecked'}
    >
      {disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0.5 z-0 inline-flex items-center gap-px rounded-full border border-amber-400/20 bg-amber-400/[0.1] px-1 py-px text-[5px] font-semibold uppercase tracking-[0.06em] text-amber-300"
        >
          <Lock className="size-1" aria-hidden="true" />
          Pro
        </span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none relative z-10 block rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.4)] transition-transform duration-200 ease-out disabled:bg-zinc-200"
        style={{
          width: thumbDimensions,
          height: thumbDimensions,
          minWidth: thumbDimensions,
          minHeight: thumbDimensions,
          transform: checked
            ? `translateX(${dimensions.width - thumbDimensions - 4}px)`
            : 'translateX(2px)',
          backgroundColor: disabled ? '#d4d4d8' : '#ffffff',
        }}
      />
    </button>
  );
}
