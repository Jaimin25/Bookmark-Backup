import * as React from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

interface TabsProps extends React.ComponentPropsWithoutRef<"div"> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { className, defaultValue, value, onValueChange, children, ...props },
    ref
  ) => (
    <BaseTabs.Root
      ref={ref}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(newValue) => {
        if (newValue !== null && onValueChange) {
          onValueChange(newValue as string);
        }
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </BaseTabs.Root>
  )
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <BaseTabs.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<"button"> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => (
    <BaseTabs.Tab
      ref={ref}
      value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        // Base UI uses data-active attribute for selected tabs
        "data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </BaseTabs.Tab>
  )
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => (
    <BaseTabs.Panel
      ref={ref}
      value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
