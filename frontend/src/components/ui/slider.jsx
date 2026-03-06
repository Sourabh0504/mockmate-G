import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/utils';

export function Slider({ className, ...props }) {
    return (
        <SliderPrimitive.Root
            className={cn('relative flex w-full touch-none items-center cursor-pointer', className)}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
                <SliderPrimitive.Range className="absolute h-full bg-primary rounded-full" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-[0_0_14px_hsl(var(--primary)/0.5)] ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
    );
}
