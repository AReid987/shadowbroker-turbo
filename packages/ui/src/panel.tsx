import * as React from "react";
import { cn } from "./utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border/50 bg-card/80 backdrop-blur text-card-foreground shadow",
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            {title}
          </h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
);
Panel.displayName = "Panel";

export { Panel };
