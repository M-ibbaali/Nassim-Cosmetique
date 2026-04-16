"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({ children, defaultValue, className }: { children: React.ReactNode, defaultValue: string, className?: string }) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <div className={cn("flex flex-col", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, setActiveTab, className }: { children: React.ReactNode, activeTab?: string, setActiveTab?: (v: string) => void, className?: string }) => (
  <div className={cn("inline-flex items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab });
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({ value, children, activeTab, setActiveTab, className }: { value: string, children: React.ReactNode, activeTab?: string, setActiveTab?: (v: string) => void, className?: string }) => (
  <button
    type="button"
    onClick={() => setActiveTab?.(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      activeTab === value ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50",
      className
    )}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, activeTab, className }: { value: string, children: React.ReactNode, activeTab?: string, className?: string }) => {
  if (activeTab !== value) return null;
  return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
