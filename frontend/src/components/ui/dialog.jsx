import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({ className, children, ...props }) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
            <DialogPrimitive.Content
                className={cn(
                    'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg',
                    'bg-[hsl(240,10%,5.5%)]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_hsl(240,10%,0%/0.6)]',
                    'data-[state=open]:animate-fade-in',
                    className
                )}
                {...props}
            >
                {children}
                <DialogPrimitive.Close className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer text-lg">✕</DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn('flex flex-col space-y-1.5', className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
    return <DialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
    return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
