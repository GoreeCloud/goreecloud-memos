import React from "react";
import { cn } from "@/lib/utils";

interface SettingSectionProps {
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, children, className, actions }) => {
  return (
    <div className={cn("mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-6 py-2 sm:py-3", className)}>
      {(title || description || actions) && (
        <div className="flex min-w-0 flex-col gap-3 border-b border-border/55 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            {title && (
              <div className="mb-1.5 text-xl font-semibold tracking-tight text-foreground">
                {typeof title === "string" ? <h3>{title}</h3> : title}
              </div>
            )}
            {description && <p className="w-full max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </div>
  );
};

export default SettingSection;
