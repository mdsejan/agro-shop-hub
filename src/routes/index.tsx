import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sprout, FlaskConical, Hammer, Tractor, Droplets, LayoutGrid, Truck, Leaf, ShoppingCart, PackageX } from "lucide-react";
import heroImg from "@/assets/hero-farm.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, productsQuery, type Product } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KrishiBazar — Seeds, Tools & Farm Supplies" },
      { name: "description", content: "Shop quality seeds, fertilizers, farm tools and irrigation kits with cash on delivery." },
      { property: "og:title", content: "KrishiBazar — Seeds, Tools & Farm Supplies" },
      { property: "og:description", content: "Quality agro products delivered to your farm. Cash on delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATS = [
  { name: "All", icon: LayoutGrid },
  { name: "Seeds", icon: Sprout },
  { name: "Fertilizer", icon: FlaskConical },
  { name: "Tools", icon: Hammer },
  { name: "Equipment", icon: Tractor },
  { name: "Irrigation", icon: Droplets },
];

function Index() {
  const { data, isLoading, isError } = useQuery(productsQuery);
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<Product | null>(null);
  const items = useMemo(() => (data ?? []).filter((p) => cat === "All" || p.category === cat), [data, cat]);

  const pickCat = (c: string) => {
    setCat(c);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <img src={heroImg} alt="Farmer holding a seedling in a green field" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground animate-rise">
            <Leaf className="h-3.5 w-3.5" /> Monsoon sale · up to 20% off
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.05] text-primary-foreground sm:text-6xl animate-rise [animation-delay:80ms]">
            Grow more. <br /> Spend less on every harvest.
          </h1>
          <p className="mt-5 max-w-lg text-base text-primary-foreground/85 sm:text-lg animate-rise [animation-delay:160ms]">
            Certified seeds, fertilizers and sturdy farm tools — delivered to your door with cash on delivery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:240ms]">
            <Button size="lg" variant="secondary" onClick={() => pickCat("All")}>
              <ShoppingCart className="h-4 w-4" /> Shop now
            </Button>
            <span className="flex items-center gap-2 text-sm text-primary-foreground/85">
              <Truck className="h-4 w-4" /> Free delivery over ৳2,000
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 max-w-7xl px-4 sm:px-6">
        <div className="flex gap-3 overflow-x-auto rounded-2xl bg-card p-3 shadow-lift [scrollbar-width:none] sm:grid sm:grid-cols-6">
          {CATS.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => pickCat(name)}
              className={`flex min-w-[88px] flex-col items-center gap-2 rounded-xl px-3 py-4 text-sm font-semibold transition-all duration-300 ${
                cat === name ? "bg-gradient-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="h-6 w-6" />
              {name}
            </button>
          ))}
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">{cat === "All" ? "All products" : cat}</h2>
            <p className="mt-1 text-muted-foreground">{items.length} items available</p>
          </div>
        </div>

        {isError && <p className="text-destructive">Couldn't load products. Please refresh.</p>}

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl bg-card p-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          {items.map((p, i) => (
            <article
              key={p.id}
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift animate-rise"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  {p.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <h3 className="font-sans text-sm font-bold leading-snug sm:text-base">{p.name}</h3>
                <p className="mt-1 line-clamp-2 hidden text-sm text-muted-foreground sm:block">{p.description}</p>
                <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-display text-xl font-semibold text-primary">{formatPrice(p.price)}</span>
                  <Button size="sm" onClick={() => setSelected(p)}>Order now</Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!isLoading && items.length === 0 && !isError && (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <PackageX className="h-10 w-10" />
            <p className="mt-2">No products in this category yet.</p>
          </div>
        )}
      </section>

      <footer className="border-t border-border bg-secondary py-8 text-center text-sm text-secondary-foreground">
        © {new Date().getFullYear()} KrishiBazar · Fresh supplies for every farm
      </footer>

      <CheckoutModal product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
