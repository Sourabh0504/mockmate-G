import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }) {
    return (
        <SelectPrimitive.Trigger
            className={cn(
                'flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 h-11 text-sm text-foreground placeholder:text-muted-foreground hover:border-white/[0.15] focus:outline-none focus:border-primary/50 transition-all cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

export function SelectContent({ className, children, ...props }) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                className={cn(
                    'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-white/[0.08] bg-[hsl(240,10%,8%)] backdrop-blur-2xl shadow-xl',
                    className
                )}
                position="popper"
                {...props}
            >
                <SelectPrimitive.Viewport className="p-1">
                    {children}
                </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

export function SelectItem({ className, children, ...props }) {
    return (
        <SelectPrimitive.Item
            className={cn(
                'relative flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-muted-foreground outline-none hover:text-foreground hover:bg-muted/50 transition-colors data-[state=checked]:text-primary',
                className
            )}
            {...props}
        >
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}
