import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

interface SeoArticleProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function SeoArticle({ title, subtitle, children }: SeoArticleProps) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
      </header>

      <div className="prose prose-sm max-w-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:space-y-2 [&_ul]:mb-6 [&_li]:text-muted-foreground">
        {children}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl border bg-primary/5 p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to try Instructly?</h2>
        <p className="mt-2 text-muted-foreground">14-day free trial. No card required. Set up in under 5 minutes.</p>
        <Link href="/signup" className={buttonVariants({ size: "lg", className: "mt-6 gap-2" })}>
          Start free trial <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="not-prose my-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
