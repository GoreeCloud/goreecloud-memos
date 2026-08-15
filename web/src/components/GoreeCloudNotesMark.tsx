import { NotebookPenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  logoUrl?: string;
}

const GoreeCloudNotesMark = ({ className, logoUrl }: Props) => {
  if (logoUrl) {
    return <img className={cn("select-none object-cover", className)} src={logoUrl} alt="" draggable={false} />;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "gc-brand-mark inline-flex shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm",
        className,
      )}
    >
      <NotebookPenIcon className="size-[58%]" strokeWidth={1.8} />
    </span>
  );
};

export default GoreeCloudNotesMark;
