import * as React from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

// Provider is just a pass-through for API compatibility
const TooltipProvider = ({ children }: TooltipProviderProps) => <>{children}</>;

interface TooltipProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  delayDuration?: number;
}

const Tooltip = ({
  children,
  open,
  onOpenChange,
  defaultOpen,
  delayDuration = 300,
}: TooltipProps) => (
  <BaseTooltip.Provider delay={delayDuration}>
    <BaseTooltip.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
    >
      {children}
    </BaseTooltip.Root>
  </BaseTooltip.Provider>
);

interface TooltipTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return (
        <BaseTooltip.Trigger
          ref={ref}
          render={children as React.ReactElement}
          {...props}
        />
      );
    }
    return (
      <BaseTooltip.Trigger ref={ref} className={className} {...props}>
        {children}
      </BaseTooltip.Trigger>
    );
  }
);
TooltipTrigger.displayName = "TooltipTrigger";

interface TooltipContentProps extends React.ComponentPropsWithoutRef<"div"> {
  sideOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, sideOffset = 4, side = "top", ...props }, ref) => (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner sideOffset={sideOffset} side={side}>
        <BaseTooltip.Popup
          ref={ref}
          className={cn(
            "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground",
            className
          )}
          {...props}
        />
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  )
);
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
