"use client";

import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ProductImage({ src, alt, className, containerClassName }: ProductImageProps) {
  return (
    <div className={cn(
      "relative h-full w-full overflow-hidden flex items-center justify-center rounded-lg bg-gradient-to-br from-pink-50 to-violet-50 border border-white/50 shadow-inner group",
      containerClassName
    )}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
            className
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center opacity-40 transition-all duration-300 group-hover:opacity-60 group-hover:scale-110">
          <Package className="w-1/3 h-1/3 text-pink-500 mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-black uppercase tracking-tighter text-pink-600/50">BeautyPOS</span>
        </div>
      )}
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-lg pointer-events-none" />
    </div>
  );
}
