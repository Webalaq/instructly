"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  InboxIcon,
  CreditCardIcon,
  UserCircleIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/instructor/students", label: "Students", icon: UsersIcon },
  { href: "/instructor/bookings", label: "Bookings", icon: CalendarIcon },
  { href: "/instructor/availability", label: "Availability", icon: ClockIcon },
  { href: "/instructor/requests", label: "Requests", icon: InboxIcon },
  { href: "/instructor/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/instructor/profile", label: "Profile", icon: UserCircleIcon },
];

export function SidebarNav() {
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
