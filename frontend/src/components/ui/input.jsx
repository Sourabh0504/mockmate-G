import { cn } from '../../lib/utils';

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                'flex h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/[0.35] hover:border-white/[0.15] focus:border-primary/50 focus:bg-white/[0.04] focus:outline-none transition-all duration-200 shadow-[inset_0_1px_2px_hsl(240,10%,0%/0.3)]',
                className
            )}
            {...props}
        />
    );
}

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                'flex w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/[0.35] hover:border-white/[0.15] focus:border-primary/50 focus:bg-white/[0.04] focus:outline-none transition-all duration-200 shadow-[inset_0_1px_2px_hsl(240,10%,0%/0.3)] resize-none',
                className
            )}
            {...props}
        />
    );
}

export function Label({ className, ...props }) {
    return (
        <label
            className={cn('text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 flex items-center gap-2', className)}
            {...props}
        />
    );
}
