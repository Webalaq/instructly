"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  parseISO,
  eachDayOfInterval,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/lib/schemas/booking";
import type { Student } from "@/lib/schemas/student";
import BookingDialog from "./BookingDialog";
import BookingDetailDialog from "./BookingDetailDialog";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

type ViewMode = "day" | "week" | "month";

const STATUS_VARIANT: Record<Booking["status"], "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

interface WeekCalendarProps {
  bookings: Booking[];
  students: Student[];
  defaultPricePence: number;
  defaultLessonMinutes: number;
}

export default function WeekCalendar({
  bookings,
  students,
  defaultPricePence,
  defaultLessonMinutes,
}: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("day");

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status === "cancelled") continue;
      const dayKey = format(parseISO(b.start_at), "yyyy-MM-dd");
      const existing = map.get(dayKey) ?? [];
      existing.push(b);
      map.set(dayKey, existing);
    }
    return map;
  }, [bookings]);

  const studentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) map.set(s.id, s.full_name);
    return map;
  }, [students]);

  function navigate(dir: -1 | 1) {
    if (view === "day") setCurrentDate((d) => addDays(d, dir));
    else if (view === "week") setCurrentDate((d) => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
  }

  function getBookingsForSlot(day: Date, hour: number) {
    const dayKey = format(day, "yyyy-MM-dd");
    const slotStart = hour * 60;
    const slotEnd = (hour + 1) * 60;
    return (bookingsByDay.get(dayKey) ?? []).filter((b) => {
      const start = parseISO(b.start_at);
      const end = parseISO(b.end_at);
      const bStartMin = start.getHours() * 60 + start.getMinutes();
      const bEndMin = end.getHours() * 60 + end.getMinutes();
      // Booking overlaps this hour slot if it starts before slot ends AND ends after slot starts
      return bStartMin < slotEnd && bEndMin > slotStart;
    });
  }

  function isBookingStart(booking: Booking, hour: number) {
    return parseISO(booking.start_at).getHours() === hour;
  }

  // Compute days to show
  const days = useMemo(() => {
    if (view === "day") return [currentDate];
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
    // month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate, view]);

  const headerText = useMemo(() => {
    if (view === "day") return format(currentDate, "EEE d MMMM yyyy");
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "d MMM")} – ${format(addDays(weekStart, 6), "d MMM yyyy")}`;
    }
    return format(currentDate, "MMMM yyyy");
  }, [currentDate, view]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
          <h2 className="ml-2 text-sm font-semibold sm:text-base">{headerText}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-lg border border-input p-0.5">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <BookingDialog
            mode="add"
            students={students}
            defaultDate={format(currentDate, "yyyy-MM-dd")}
            defaultPricePence={defaultPricePence}
            defaultLessonMinutes={defaultLessonMinutes}
            trigger={<Button size="sm">New booking</Button>}
          />
        </div>
      </div>

      {/* Month view */}
      {view === "month" ? (
        <div className="rounded-lg border overflow-hidden">
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Padding for start of month */}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} className="border-b border-r p-2 min-h-[60px] bg-muted/20" />
            ))}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayBookings = (bookingsByDay.get(dayKey) ?? []);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => { setCurrentDate(day); setView("day"); }}
                  className={`border-b border-r p-2 min-h-[60px] text-left hover:bg-accent/50 transition-colors ${
                    isToday ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>
                    {format(day, "d")}
                  </div>
                  {dayBookings.length > 0 && (
                    <div className="mt-1">
                      <span className="inline-block rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        {dayBookings.length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Day / Week grid view */
        <div className="overflow-x-auto rounded-lg border">
          <div className={`${view === "day" ? "min-w-0" : "min-w-[800px]"}`}>
            {/* Day headers */}
            {view === "week" && (
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
                <div className="p-2" />
                {days.map((day) => (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => { setCurrentDate(day); setView("day"); }}
                    className={`p-2 text-center text-sm font-medium hover:bg-accent/50 transition-colors ${
                      isSameDay(day, new Date()) ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <div>{format(day, "EEE")}</div>
                    <div className="text-lg">{format(day, "d")}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Time slots */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className={`grid border-b last:border-b-0 ${
                  view === "day"
                    ? "grid-cols-[50px_1fr]"
                    : "grid-cols-[60px_repeat(7,1fr)]"
                }`}
              >
                <div className="border-r p-2 text-right text-xs text-muted-foreground">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {days.map((day) => {
                  const slotBookings = getBookingsForSlot(day, hour);
                  const hasBooking = slotBookings.length > 0;
                  return (
                    <div
                      key={day.toISOString() + hour}
                      className={`border-r p-1 last:border-r-0 transition-colors ${
                        hasBooking ? "" : "hover:bg-accent/30"
                      } ${view === "day" ? "min-h-[70px]" : "min-h-[60px]"}`}
                    >
                      {slotBookings.map((b) => {
                        const isStart = isBookingStart(b, hour);
                        if (!isStart) {
                          // Continuation block — just a colored bar
                          return (
                            <div key={b.id} className="h-full rounded bg-primary/10 border-l-2 border-primary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {studentMap.get(b.student_id) ?? ""}
                            </div>
                          );
                        }
                        // Start block — full detail
                        return (
                          <BookingDetailDialog
                            key={b.id}
                            booking={b}
                            students={students}
                            defaultPricePence={defaultPricePence}
                            defaultLessonMinutes={defaultLessonMinutes}
                            trigger={
                              <div className={`cursor-pointer rounded border-l-2 border-primary p-1.5 text-xs transition-colors bg-primary/10 hover:bg-primary/20 ${
                                view === "day" ? "flex items-center gap-3" : ""
                              }`}>
                                <div className="font-medium truncate">
                                  {studentMap.get(b.student_id) ?? "Unknown"}
                                </div>
                                <div className="text-muted-foreground">
                                  {format(parseISO(b.start_at), "HH:mm")}–{format(parseISO(b.end_at), "HH:mm")}
                                </div>
                                {view === "day" && (
                                  <Badge variant={STATUS_VARIANT[b.status]} className="text-[10px] ml-auto">
                                    {b.status}
                                  </Badge>
                                )}
                              </div>
                            }
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
