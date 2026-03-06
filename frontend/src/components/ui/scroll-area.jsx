import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '../../lib/utils';

export function ScrollArea({ className, children, ...props }) {
    return (
        <ScrollAreaPrimitive.Root className={cn('relative overflow-hidden', className)} {...props}>
            <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollAreaPrimitive.Scrollbar
                orientation="vertical"
                className="flex touch-none select-none transition-colors w-1.5 p-px"
            >
                <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-primary/20" />
            </ScrollAreaPrimitive.Scrollbar>
        </ScrollAreaPrimitive.Root>
    );
}
