"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarIcon,
  PlusIcon,
  BellIcon,
  UserIcon,
} from "lucide-react";

const LEFT_ITEMS = [
  { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/instructor/students", label: "Students", icon: UsersIcon },
];

const RIGHT_ITEMS = [
  { href: "/instructor/bookings", label: "Bookings", icon: CalendarIcon },
  { href: "/instructor/profile", label: "Profile", icon: UserIcon },
];

export function MobileNav() {
  const pathname = usePathname();

  function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] transition-colors active:scale-95 ${
          active ? "text-primary font-semibold" : "text-muted-foreground"
        }`}
      >
        <Icon className="size-5" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {LEFT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Center FAB */}
        <div className="flex flex-1 items-center justify-center -mt-5">
          <Link
            href="/instructor/bookings"
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-90 transition-transform"
          >
            <PlusIcon className="size-6" />
          </Link>
        </div>

        {RIGHT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>
    </nav>
  );
}
