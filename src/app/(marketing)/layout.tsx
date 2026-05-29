import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">I</div>
            <span className="text-xl font-bold tracking-tight">Instructly</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log in</Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>Get started</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Instructly. Driving instructor software for UK ADIs and PDIs.
        </div>
      </footer>
    </div>
  );
}
