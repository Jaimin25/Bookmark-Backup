import * as React from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { cn } from "@/lib/utils";

// Context to track value-to-label mapping
interface SelectContextValue {
  registerItem: (value: string, label: string) => void;
  getLabel: (value: string) => string | undefined;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}

const Select = ({
  value,
  onValueChange,
  children,
  defaultValue,
}: SelectProps) => {
  const itemsRef = React.useRef<Map<string, string>>(new Map());

  const contextValue = React.useMemo(
    () => ({
      registerItem: (itemValue: string, label: string) => {
        itemsRef.current.set(itemValue, label);
      },
      getLabel: (itemValue: string) => itemsRef.current.get(itemValue),
    }),
    []
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <BaseSelect.Root
        value={value}
        onValueChange={(newValue) => {
          if (newValue !== null && onValueChange) {
            onValueChange(newValue);
          }
        }}
        defaultValue={defaultValue}
      >
        {children}
      </BaseSelect.Root>
    </SelectContext.Provider>
  );
};

const SelectGroup = ({ children }: { children: React.ReactNode }) => (
  <BaseSelect.Group>{children}</BaseSelect.Group>
);

interface SelectValueProps {
  placeholder?: string;
  className?: string;
  fallbackLabel?: string;
}

// SelectValue uses context to get the label for the current value
const SelectValue = ({
  placeholder,
  className,
  fallbackLabel,
}: SelectValueProps) => {
  const context = React.useContext(SelectContext);

  return (
    <BaseSelect.Value
      className={cn("data-[placeholder]:text-muted-foreground", className)}
    >
      {(value) => {
        if (value === null || value === undefined) {
          return <span className="text-muted-foreground">{placeholder}</span>;
        }
        // Try to get label from context, then fallbackLabel, then value
        const label = context?.getLabel(value as string);
        return label ?? fallbackLabel ?? value;
      }}
    </BaseSelect.Value>
  );
};

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  id?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <BaseSelect.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <BaseSelect.Icon className="ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
);
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => (
  <BaseSelect.Portal>
    <BaseSelect.Positioner>
      <BaseSelect.Popup
        ref={ref}
        className={cn(
          "z-50 max-h-60 min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg",
          className
        )}
        {...props}
      >
        {children}
      </BaseSelect.Popup>
    </BaseSelect.Positioner>
  </BaseSelect.Portal>
));
SelectContent.displayName = "SelectContent";

interface SelectItemProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext);

    // Register item value-to-label mapping
    // Extract label text from children - handle both string and ReactNode
    const labelText = React.useMemo(() => {
      // Direct string
      if (typeof children === "string") {
        return children;
      }
      // React element - extract from props.children
      if (React.isValidElement(children)) {
        const propsChildren = (children as React.ReactElement).props?.children;
        if (typeof propsChildren === "string") {
          return propsChildren;
        }
        // If props.children is an array, get first string element
        if (Array.isArray(propsChildren)) {
          const firstString = propsChildren.find(
            (item) => typeof item === "string"
          );
          if (firstString) return firstString;
        }
      }
      // Array of children - find first string
      if (Array.isArray(children)) {
        const firstString = children.find((item) => typeof item === "string");
        if (firstString) return firstString;
      }
      // Fallback: convert to string (shouldn't happen for simple labels)
      return String(children);
    }, [children]);

    // Register immediately - use useLayoutEffect to ensure it happens before render
    React.useLayoutEffect(() => {
      if (context && labelText) {
        context.registerItem(value, labelText);
      }
    }, [context, value, labelText]);

    return (
      <BaseSelect.Item
        ref={ref}
        value={value}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none",
          // Base UI uses data-highlighted for hover/focus state
          "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        {...props}
      >
        <BaseSelect.ItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </BaseSelect.ItemIndicator>
        <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      </BaseSelect.Item>
    );
  }
);
SelectItem.displayName = "SelectItem";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <BaseSelect.GroupLabel
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <BaseSelect.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
