import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex min-h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-primary/15 bg-primary/10 text-primary [a]:hover:bg-primary/15',
        secondary:
          'border-border/80 bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        destructive:
          'border-destructive/15 bg-destructive/10 text-destructive [a]:hover:bg-destructive/15',
        outline:
          'border-border bg-transparent text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
        link: 'border-transparent bg-transparent px-0 text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
