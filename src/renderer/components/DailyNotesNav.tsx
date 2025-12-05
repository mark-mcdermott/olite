import React, { useState, useEffect } from 'react';

interface DailyNotesNavProps {
  onDateSelect: (date: string) => void;
  currentDate?: string | null;
  existingDates?: string[];
}

export const DailyNotesNav: React.FC<DailyNotesNavProps> = ({
  onDateSelect,
  currentDate,
  existingDates = []
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getToday = (): string => {
    return formatDate(new Date());
  };

  const getRelativeDate = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return formatDate(date);
  };

  const goToToday = () => {
    onDateSelect(getToday());
  };

  const goToYesterday = () => {
    onDateSelect(getRelativeDate(-1));
  };

  const goToTomorrow = () => {
    onDateSelect(getRelativeDate(1));
  };

  const previousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add padding days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push(day);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add padding days from next month
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const days = getDaysInMonth(selectedMonth);
  const today = getToday();
  const monthName = selectedMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const hasNote = (date: Date): boolean => {
    return existingDates.includes(formatDate(date));
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === selectedMonth.getMonth();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Quick actions */}
      <div className="p-3 border-b border-obsidian-border">
        <div className="space-y-2">
          <button
            onClick={goToToday}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded transition-colors"
          >
            Today
          </button>
          <div className="flex gap-2">
            <button
              onClick={goToYesterday}
              className="flex-1 px-3 py-1.5 text-xs text-obsidian-text-secondary bg-obsidian-surface hover:bg-obsidian-hover rounded transition-colors"
            >
              Yesterday
            </button>
            <button
              onClick={goToTomorrow}
              className="flex-1 px-3 py-1.5 text-xs text-obsidian-text-secondary bg-obsidian-surface hover:bg-obsidian-hover rounded transition-colors"
            >
              Tomorrow
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-3">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={previousMonth}
            className="p-1 hover:bg-obsidian-hover rounded transition-colors text-obsidian-text-secondary hover:text-obsidian-text"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-obsidian-text">{monthName}</span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-obsidian-hover rounded transition-colors text-obsidian-text-secondary hover:text-obsidian-text"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-medium text-obsidian-text-muted uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            const dateStr = formatDate(date);
            const isToday = dateStr === today;
            const isSelected = dateStr === currentDate;
            const inCurrentMonth = isCurrentMonth(date);
            const noteExists = hasNote(date);

            return (
              <button
                key={i}
                onClick={() => onDateSelect(dateStr)}
                className={`
                  aspect-square p-1 text-xs rounded transition-colors relative
                  ${!inCurrentMonth ? 'text-obsidian-text-muted/50' : 'text-obsidian-text-secondary'}
                  ${isToday ? 'font-bold ring-1 ring-accent text-accent' : ''}
                  ${isSelected ? 'bg-accent/20 text-accent' : 'hover:bg-obsidian-hover'}
                `}
              >
                {date.getDate()}
                {noteExists && inCurrentMonth && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
