import { cn } from '../../lib/utils';

export function Button({ className, variant = 'default', size = 'default', ...props }) {
    const base = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer font-poppins';

    const variants = {
        default: 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_28px_hsl(var(--primary)/0.6)] hover:-translate-y-px',
        outline: 'border border-border bg-transparent text-foreground hover:bg-muted/50 hover:border-white/20',
        ghost: 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
    };

    const sizes = {
        default: 'h-10 px-5 py-2 text-sm',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
    };

    return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
