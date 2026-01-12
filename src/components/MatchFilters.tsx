import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Calendar } from "lucide-react";

interface MatchFiltersProps {
  leagues: string[];
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const MatchFilters = ({
  leagues,
  selectedLeague,
  onLeagueChange,
  selectedDate,
  onDateChange,
}: MatchFiltersProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
      {/* League Filter */}
      <div className="flex items-center gap-2 flex-1 sm:flex-none">
        <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <Select value={selectedLeague} onValueChange={onLeagueChange}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background border-border">
            <SelectValue placeholder={t('filters.allLeagues')} />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="all">{t('filters.allLeagues')}</SelectItem>
            {leagues.map((league) => (
              <SelectItem key={league} value={league}>
                {league}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-2 flex-1 sm:flex-none">
        <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <Select value={selectedDate} onValueChange={onDateChange}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background border-border">
            <SelectValue placeholder={t('filters.allDates')} />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="all">{t('filters.allDates')}</SelectItem>
            <SelectItem value="today">{t('filters.today')}</SelectItem>
            <SelectItem value="tomorrow">{t('filters.tomorrow')}</SelectItem>
            <SelectItem value="week">{t('filters.thisWeek')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
