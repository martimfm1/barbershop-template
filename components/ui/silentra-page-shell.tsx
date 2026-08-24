import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SilentraPageShell({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <main
      className={cn(
        'silentra-page-shell',
        narrow ? 'silentra-page-shell-narrow' : '',
        className,
      )}
    >
      <div className="silentra-page-grid" aria-hidden="true" />
      <div className="silentra-page-content">{children}</div>
    </main>
  );
}

export function SilentraPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('silentra-page-header', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="silentra-eyebrow">{eyebrow}</p> : null}
        <h1 className="silentra-page-title">{title}</h1>
        {description ? (
          <p className="silentra-page-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="silentra-page-actions">{actions}</div> : null}
    </header>
  );
}

export function SilentraSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('silentra-section-block', className)}>
      {children}
    </section>
  );
}
