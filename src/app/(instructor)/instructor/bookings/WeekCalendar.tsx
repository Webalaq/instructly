"use client";

import { useState, useMemo, useRef, useCallback } from "react";
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
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/lib/schemas/booking";
import type { Student } from "@/lib/schemas/student";
import type { RecurringSlot } from "@/lib/availability";
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
  recurring: RecurringSlot[];
  blocked: string[];
}

export default function WeekCalendar({
  bookings,
  students,
  defaultPricePence,
  defaultLessonMinutes,
  recurring,
  blocked,
}: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("day");

  // Swipe handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = true;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe > 60px and more horizontal than vertical
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const dir = dx > 0 ? -1 : 1;
      if (view === "day") setCurrentDate((d) => addDays(d, dir));
      else if (view === "week") setCurrentDate((d) => dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1));
      else setCurrentDate((d) => dir === 1 ? addMonths(d, 1) : subMonths(d, 1));
    }
  }, [view]);

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
      return bStartMin < slotEnd && bEndMin > slotStart;
    });
  }

  function isBookingStart(booking: Booking, hour: number) {
    return parseISO(booking.start_at).getHours() === hour;
  }

  const days = useMemo(() => {
    if (view === "day") return [currentDate];
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
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
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="icon" className="size-10" onClick={() => navigate(-1)}>
            <ChevronLeftIcon className="size-5" />
          </Button>
          <Button variant="outline" className="h-10 px-4 text-sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="size-10" onClick={() => navigate(1)}>
            <ChevronRightIcon className="size-5" />
          </Button>
          <h2 className="ml-2 text-sm font-semibold sm:text-base truncate">{headerText}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher — bigger touch targets */}
          <div className="flex rounded-lg border border-input p-0.5">
            {(["day", "week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground active:bg-accent"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Desktop new booking */}
          <div className="hidden sm:block">
            <BookingDialog
              mode="add"
              students={students}
              defaultDate={format(currentDate, "yyyy-MM-dd")}
              defaultPricePence={defaultPricePence}
              defaultLessonMinutes={defaultLessonMinutes}
              trigger={<Button className="h-10">New booking</Button>}
            />
          </div>
        </div>
      </div>

      {/* Calendar body with swipe */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Month view */}
        {view === "month" ? (
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-muted/50">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`pad-${i}`} className="border-b border-r p-2 min-h-[52px] sm:min-h-[60px] bg-muted/20" />
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
                    className={`border-b border-r p-1.5 sm:p-2 min-h-[52px] sm:min-h-[60px] text-left active:bg-accent/70 transition-colors ${
                      isToday ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className={`text-sm ${isToday ? "flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold" : ""}`}>
                      {format(day, "d")}
                    </div>
                    {dayBookings.length > 0 && (
                      <div className="mt-0.5">
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
              {view === "week" && (
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50">
                  <div className="p-2" />
                  {days.map((day) => (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => { setCurrentDate(day); setView("day"); }}
                      className={`p-2 text-center text-sm font-medium active:bg-accent/70 transition-colors ${
                        isSameDay(day, new Date()) ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      <div>{format(day, "EEE")}</div>
                      <div className="text-lg">{format(day, "d")}</div>
                    </button>
                  ))}
                </div>
              )}

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
                          hasBooking ? "" : "active:bg-accent/50"
                        } ${view === "day" ? "min-h-[70px]" : "min-h-[60px]"}`}
                      >
                        {slotBookings.map((b) => {
                          const isStart = isBookingStart(b, hour);
                          if (!isStart) {
                            return (
                              <div key={b.id} className="h-full rounded bg-primary/10 border-l-2 border-primary px-2 py-1 text-xs text-muted-foreground">
                                {studentMap.get(b.student_id) ?? ""}
                              </div>
                            );
                          }
                          return (
                            <BookingDetailDialog
                              key={b.id}
                              booking={b}
                              students={students}
                              defaultPricePence={defaultPricePence}
                              defaultLessonMinutes={defaultLessonMinutes}
                              recurring={recurring}
                              blocked={blocked}
                              existingBookings={bookings.filter((x) => x.status === "scheduled").map((x) => ({ start_at: x.start_at, end_at: x.end_at }))}
                              trigger={
                                <div className={`cursor-pointer rounded border-l-2 border-primary p-2 text-sm transition-colors bg-primary/10 active:bg-primary/25 ${
                                  view === "day" ? "flex items-center gap-3" : ""
                                }`}>
                                  <div className="font-medium truncate">
                                    {studentMap.get(b.student_id) ?? "Unknown"}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
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

      {/* Floating Action Button — mobile only */}
      <div className="fixed bottom-24 right-4 z-40 sm:hidden">
        <BookingDialog
          mode="add"
          students={students}
          defaultDate={format(currentDate, "yyyy-MM-dd")}
          defaultPricePence={defaultPricePence}
          defaultLessonMinutes={defaultLessonMinutes}
          trigger={
            <Button size="icon" className="size-14 rounded-full shadow-lg shadow-primary/25 active:scale-95 transition-transform">
              <PlusIcon className="size-7" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
