import * as React from "react";
import { cn } from "./utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded bg-popover text-popover-foreground border shadow-lg whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}

export { Tooltip };
