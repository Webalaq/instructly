"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  BarChart3Icon,
  CalendarIcon,
  BookOpenIcon,
  SendIcon,
  UserCircleIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Home", icon: LayoutDashboardIcon },
  { href: "/student/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/student/lessons", label: "Lessons", icon: BookOpenIcon },
  { href: "/student/progress", label: "Progress", icon: BarChart3Icon },
  { href: "/student/requests", label: "Request Lesson", icon: SendIcon },
  { href: "/student/profile", label: "Profile", icon: UserCircleIcon },
];

export function StudentSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
