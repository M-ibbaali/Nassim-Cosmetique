"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex items-start justify-between">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              variant === "danger" ? "bg-red-100 text-red-600" : 
              variant === "warning" ? "bg-amber-100 text-amber-600" : 
              "bg-blue-100 text-blue-600"
            )}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-4">
            <Dialog.Title className="text-lg font-bold text-foreground">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {description}
            </Dialog.Description>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="ghost" disabled={isLoading}>
                {cancelText}
              </Button>
            </Dialog.Close>
            <Button
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              disabled={isLoading}
              className={cn(
                variant === "warning" && "bg-amber-500 hover:bg-amber-600 text-white",
                "min-w-[100px]"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
