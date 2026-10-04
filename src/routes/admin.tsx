import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, LogOut, PackagePlus, ShieldAlert } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderManagement } from "@/components/OrderManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES, formatPrice, productsQuery } from "@/lib/products";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — KrishiBazar Product Manager" },
      { name: "description", content: "Add and manage products in the KrishiBazar store." },
      { property: "og:title", content: "Admin — KrishiBazar Product Manager" },
      { property: "og:description", content: "Store administration for KrishiBazar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {!ready ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : !session ? (
          <AuthCard />
        ) : isAdmin === null ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        ) : !isAdmin ? (
          <div className="mx-auto max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 text-2xl font-semibold">No admin access</h1>
            <p className="mt-2 text-sm text-muted-foreground">This account isn't an administrator.</p>
            <Button variant="outline" className="mt-6" onClick={() => supabase.auth.signOut()}>Sign out</Button>
          </div>
        ) : (
          <Dashboard email={session.user.email ?? ""} />
        )}
      </main>
    </div>
  );
}

function AuthCard() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up") toast.success("Check your email to confirm your account.");
  };

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-card p-8 shadow-card animate-rise">
      <h1 className="text-2xl font-semibold">{mode === "in" ? "Admin sign in" : "Create admin account"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">The first account created becomes the store admin.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} {mode === "in" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <button className="mt-4 w-full text-sm text-primary hover:underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  price: z.number({ invalid_type_error: "Price must be a number" }).min(0).max(10_000_000),
  image_url: z.string().trim().url("Image URL must be a valid link").or(z.literal("")),
  category: z.string().min(1),
  description: z.string().trim().max(1000),
});

function Dashboard({ email }: { email: string }) {
  const qc = useQueryClient();
  const { data: products } = useQuery(productsQuery);
  const empty = { name: "", price: "", image_url: "", category: CATEGORIES[0] as string, description: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = productSchema.safeParse({ ...form, price: Number(form.price) });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setSaving(true);
    const { error } = await supabase.from("products").insert({ ...parsed.data, image_url: parsed.data.image_url || null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product added");
    setForm(empty);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">Order management</TabsTrigger>
          <TabsTrigger value="products">Product management</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <OrderManagement />
        </TabsContent>
        <TabsContent value="products" className="space-y-8">
      <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-card p-6 shadow-card sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="pname">Product name</Label>
          <Input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (৳)</Label>
          <Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat">Category</Label>
          <select
            id="cat"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="img">Image URL</Label>
          <Input id="img" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Button type="submit" className="sm:col-span-2" size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />} Add product
        </Button>
      </form>

      <div>
        <h2 className="mb-3 text-xl font-semibold">Current products ({products?.length ?? 0})</h2>
        <ul className="divide-y divide-border rounded-2xl bg-card shadow-card">
          {products?.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              {p.image_url ? <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-muted" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.category}</p>
              </div>
              <span className="font-semibold text-primary">{formatPrice(p.price)}</span>
            </li>
          ))}
        </ul>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
