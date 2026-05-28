import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold tracking-tight">Instructly</span>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm">Sign up free</Button>
          </nav>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Stop losing money to no-shows
        </h1>
        <p className="mt-4 max-w-lg text-lg text-muted-foreground">
          Bookings, lesson notes, progress tracking, and WhatsApp reminders —
          built for UK driving instructors.
        </p>
        <div className="mt-8 flex gap-3">
          <Button size="lg">Start 14-day free trial</Button>
          <Button variant="outline" size="lg">
            See pricing
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No card required. From £19/month.
        </p>
      </section>
    </main>
  );
}
