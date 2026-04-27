import * as React from "react";
import { cn } from "./utils";

interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: string[];
  prompt?: string;
}

const Terminal = React.forwardRef<HTMLDivElement, TerminalProps>(
  ({ className, lines = [], prompt = " > ", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border/60 bg-black/90 font-mono text-sm text-green-400 shadow-inner overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/30 bg-muted/30">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
        <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wider">shadowbroker</span>
      </div>
      <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
        {lines.map((line, i) => (
          <div key={i} className="break-all">
            <span className="text-muted-foreground">{prompt}</span>
            <span>{line}</span>
          </div>
        ))}
        {children}
      </div>
    </div>
  )
);
Terminal.displayName = "Terminal";

export { Terminal };
