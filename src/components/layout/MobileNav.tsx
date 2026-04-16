"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const { isRTL } = useLanguage();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </DialogPrimitive.Trigger>
      
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-300" />
        
        <DialogPrimitive.Content 
          className={cn(
            "fixed inset-y-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            isRTL 
              ? "right-0 data-[state=closed]:translate-x-full data-[state=open]:translate-x-0" 
              : "left-0 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0"
          )}
        >
          {/* Accessibility requirements */}
          <DialogPrimitive.Title className="sr-only">Navigation Menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Access site navigation and account settings</DialogPrimitive.Description>
          <div className="h-full overflow-y-auto no-scrollbar">
            {/* We reuse the Sidebar but we'll need to wrap it to handle closing on click */}
            <div onClick={() => setOpen(false)}>
                <Sidebar className="border-none" />
            </div>
          </div>
          
          <DialogPrimitive.Close className={cn(
            "absolute top-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 z-[60]",
            isRTL ? "left-4" : "right-4"
          )}>
            <X className="w-5 h-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
