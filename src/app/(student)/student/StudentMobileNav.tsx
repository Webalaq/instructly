"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  BarChart3Icon,
  CalendarIcon,
  UserCircleIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Home", icon: LayoutDashboardIcon },
  { href: "/student/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/student/progress", label: "Progress", icon: BarChart3Icon },
  { href: "/student/profile", label: "Profile", icon: UserCircleIcon },
];

export function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors active:scale-95 ${
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-6" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
