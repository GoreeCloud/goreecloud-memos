import { FileQuestionIcon, LoaderCircleIcon, type LucideIcon, SearchXIcon, StickyNoteIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_MESSAGES, type PlaceholderVariant } from "./messages";

interface PlaceholderProps {
  variant: PlaceholderVariant;
  message?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

const ICONS: Record<PlaceholderVariant, LucideIcon> = {
  empty: StickyNoteIcon,
  loading: LoaderCircleIcon,
  noResults: SearchXIcon,
  notFound: FileQuestionIcon,
};

const Placeholder = ({ variant, message, description, children, className }: PlaceholderProps) => {
  const resolvedMessage = message ?? DEFAULT_MESSAGES[variant];
  const isLoading = variant === "loading";
  const Icon = ICONS[variant];

  return (
    <div
      role={isLoading ? "status" : undefined}
      aria-live={isLoading ? "polite" : undefined}
      className={cn("mx-auto flex max-w-md flex-col items-center justify-center px-4 py-10 text-center", className)}
    >
      <div className="gc-context-icon flex size-12 items-center justify-center rounded-2xl border border-border/70 text-primary shadow-sm">
        <Icon className={cn("size-5", isLoading && "animate-spin")} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">{resolvedMessage}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-5 text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default Placeholder;
