"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  pickup_location: string | null;
  price_pence: number;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

export default function StudentCalendar({ bookings }: { bookings: Booking[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = format(parseISO(b.start_at), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [bookings]);

  const selectedBookings = selectedDate
    ? bookingsByDay.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  const startPadding = (days[0].getDay() + 6) % 7;

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth((d) => subMonths(d, 1))}>
          <ChevronLeftIcon className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth((d) => addMonths(d, 1))}>
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="border-b border-r p-2 min-h-[52px] bg-muted/10" />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDay.get(key) ?? [];
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={`border-b border-r p-2 min-h-[52px] text-left transition-colors ${
                  isSelected ? "bg-primary/10 ring-1 ring-primary" : isToday ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <div className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>
                  {format(day, "d")}
                </div>
                {dayBookings.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayBookings.map((b) => (
                      <span
                        key={b.id}
                        className={`size-1.5 rounded-full ${
                          b.status === "scheduled" ? "bg-primary" : "bg-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {format(selectedDate, "EEEE d MMMM")}
            {isSameDay(selectedDate, new Date()) && (
              <span className="ml-2 text-primary">(Today)</span>
            )}
          </h3>
          {selectedBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No lessons on this day
            </div>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <div key={b.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      {format(parseISO(b.start_at), "HH:mm")} – {format(parseISO(b.end_at), "HH:mm")}
                    </div>
                    <Badge variant={STATUS_VARIANT[b.status] ?? "outline"}>
                      {b.status}
                    </Badge>
                  </div>
                  {b.pickup_location && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPinIcon className="size-4" />
                      {b.pickup_location}
                    </div>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    £{(b.price_pence / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming lessons list */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Upcoming lessons</h3>
        {(() => {
          const upcoming = bookings.filter(
            (b) => b.status === "scheduled" && new Date(b.start_at) >= new Date()
          );
          if (upcoming.length === 0) {
            return (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No upcoming lessons
              </div>
            );
          }
          return (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{format(parseISO(b.start_at), "EEE d MMM")}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(b.start_at), "HH:mm")} – {format(parseISO(b.end_at), "HH:mm")}
                    </div>
                  </div>
                  <div className="text-sm font-medium">£{(b.price_pence / 100).toFixed(0)}</div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
