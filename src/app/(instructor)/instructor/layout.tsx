import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { SidebarNav } from "./SidebarNav";
import { MobileNav } from "./MobileNav";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="theme-dashboard flex min-h-screen flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            I
          </div>
          <span className="text-lg font-bold">Instructly</span>
        </div>

        <SidebarNav />

        <div className="border-t p-3">
          <div className="mb-2 px-3 text-sm font-medium truncate">
            {user?.user_metadata?.full_name || user?.email}
          </div>
          <LogoutButton className="w-full justify-start text-muted-foreground" />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex h-14 items-center justify-between border-b bg-card/95 backdrop-blur-sm px-4 md:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            I
          </div>
          <span className="text-base font-bold">Instructly</span>
        </div>
        <LogoutButton />
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
