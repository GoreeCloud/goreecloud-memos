import dayjs from "dayjs";
import { ArchiveIcon, LightbulbIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { calculateMaxCount, MonthCalendar } from "@/components/ActivityCalendar";
import { useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { useDateFilterNavigation } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import type { StatisticsData } from "@/types/statistics";
import { MonthNavigator } from "./MonthNavigator";

interface Props {
  statisticsData: StatisticsData;
  onDateSelect?: () => void;
  /** When set, day clicks land on this route with the date filter instead of filtering the current one. */
  navigationTarget?: string;
}

const PrivateNotesNavigation = () => {
  const location = useLocation();
  const items = [
    { label: "Notes", path: ROUTES.HOME, icon: LightbulbIcon },
    { label: "Archive", path: ROUTES.ARCHIVED, icon: ArchiveIcon },
    { label: "Trash", path: ROUTES.TRASH, icon: Trash2Icon },
  ];

  return (
    <nav className="flex w-full flex-col gap-1" aria-label="Notes navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-r-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "bg-primary/12 text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const StatisticsView = (props: Props) => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const isProfile = Boolean(matchPath("/u/:username", location.pathname));

  // GoreeCloud Notes uses the first sidebar section as its primary notes
  // navigation. The activity calendar remains available on profile pages,
  // where its date-oriented context is still useful, but no longer dominates
  // the private quick-note workspace.
  if (currentUser && !isProfile) {
    return <PrivateNotesNavigation />;
  }

  return <ActivityStatistics {...props} />;
};

const ActivityStatistics = (props: Props) => {
  const { statisticsData } = props;
  const { activityStats, timeBasis } = statisticsData;
  const { filters } = useMemoFilterContext();
  const navigateToDateFilter = useDateFilterNavigation(props.navigationTarget);
  const [visibleMonthString, setVisibleMonthString] = useState(dayjs().format("YYYY-MM"));
  const selectedDate = filters.find((filter) => filter.factor === "displayTime")?.value;

  return (
    <div className="group flex w-full flex-col text-muted-foreground animate-fade-in">
      <MonthNavigator visibleMonth={visibleMonthString} onMonthChange={setVisibleMonthString} />

      <div className="w-full animate-scale-in">
        <MonthCalendar
          month={visibleMonthString}
          data={activityStats}
          maxCount={calculateMaxCount(activityStats)}
          selectedDate={selectedDate}
          onClick={(date) => {
            navigateToDateFilter(date);
            props.onDateSelect?.();
          }}
          timeBasis={timeBasis}
        />
      </div>
    </div>
  );
};

export default StatisticsView;
