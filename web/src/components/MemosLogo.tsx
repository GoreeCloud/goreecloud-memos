import { useInstance } from "@/contexts/InstanceContext";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";

interface Props {
  className?: string;
  collapsed?: boolean;
  compact?: boolean;
}

function MemosLogo(props: Props) {
  const { collapsed, compact } = props;
  const { generalSetting: instanceGeneralSetting } = useInstance();
  const title = instanceGeneralSetting.customProfile?.title || "GoreeCloud Notes";
  const avatarUrl = instanceGeneralSetting.customProfile?.logoUrl || "/full-logo.webp";

  return (
    <div className={cn("relative h-auto w-full shrink-0", props.className)}>
      <div className={cn("flex w-auto flex-row items-center justify-start text-foreground", compact ? "px-0" : collapsed ? "px-1" : "px-3")}>
        <UserAvatar
          className={cn(
            "gc-brand-mark shrink-0 border border-border/60 shadow-sm",
            compact ? "size-8 rounded-xl" : "size-9 rounded-xl",
          )}
          avatarUrl={avatarUrl}
        />
        {!collapsed && (
          <div className={cn("min-w-0", compact ? "ml-2" : "ml-2.5")}>
            <span
              className={cn(
                "block shrink truncate font-semibold tracking-[-0.02em] text-foreground",
                compact ? "text-[14px]" : "text-lg",
              )}
            >
              {title}
            </span>
            {!compact && <span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Private workspace</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemosLogo;
