import { UserRoundIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  avatarUrl?: string;
  className?: string;
}

const UserAvatar = ({ avatarUrl, className }: Props) => {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center overflow-clip rounded-xl border border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      {avatarUrl ? (
        <img
          className="size-full min-h-full min-w-full object-cover shadow"
          src={avatarUrl}
          decoding="async"
          loading="lazy"
          alt=""
        />
      ) : (
        <UserRoundIcon className="size-[58%]" strokeWidth={1.7} aria-hidden="true" />
      )}
    </div>
  );
};

export default UserAvatar;
