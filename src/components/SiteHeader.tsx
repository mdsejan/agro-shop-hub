import { Link } from "@tanstack/react-router";
import { Sprout, ShieldCheck } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold text-foreground">KrishiBazar</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link to="/" hash="products" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
            Shop
          </Link>
          <Link to="/admin" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
