"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  CreditCardIcon,
  UserCircleIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/instructor/students", label: "Students", icon: UsersIcon },
  { href: "/instructor/bookings", label: "Bookings", icon: CalendarIcon },
  { href: "/instructor/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/instructor/profile", label: "Profile", icon: UserCircleIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card md:hidden">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
