"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button 
      className="bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90" 
      onClick={() => window.print()}
    >
      <Printer className="w-4 h-4 mr-2" /> Print
    </Button>
  );
}
