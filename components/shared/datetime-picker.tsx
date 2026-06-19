"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function splitValue(value: string) {
  if (!value.trim()) return { date: "", time: "09:00" };
  const [date, time = "09:00"] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

function joinValue(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "09:00"}`;
}

function formatDisplay(value: string) {
  if (!value.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toIsoDate(year: number, month: number, day: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function DateTimePicker({ id, value, onChange, placeholder = "Pick date & time" }: DateTimePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { date, time } = splitValue(value);

  const selectedDate = date ? new Date(`${date}T12:00:00`) : null;
  const [viewMonth, setViewMonth] = useState(() => {
    const base = selectedDate ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso: string | null }> = [];

    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, iso: null });
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, iso: toIsoDate(year, month, day) });
    }
    return cells;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

  const selectDate = (iso: string) => {
    onChange(joinValue(iso, time));
  };

  const selectTime = (nextTime: string) => {
    if (!date) {
      const today = toIsoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
      onChange(joinValue(today, nextTime));
      return;
    }
    onChange(joinValue(date, nextTime));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm",
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-primary" />
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onChange("");
                setOpen(false);
              }
            }}
            aria-label="Clear date"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-border bg-background p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
              }
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold">{monthLabel}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
              }
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, index) =>
              cell.day == null ? (
                <div key={`empty-${index}`} className="h-9" />
              ) : (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => selectDate(cell.iso!)}
                  className={cn(
                    "h-9 rounded-md text-sm transition-colors hover:bg-primary/10",
                    date === cell.iso && "bg-primary text-primary-foreground hover:bg-primary/90",
                    date !== cell.iso && "text-foreground",
                  )}
                >
                  {cell.day}
                </button>
              ),
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={(event) => selectTime(event.target.value)}
              className="h-9"
            />
          </div>
        </div>
      )}
    </div>
  );
}
