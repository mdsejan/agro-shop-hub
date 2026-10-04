import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Product } from "@/lib/products";

const schema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().regex(/^[+0-9\s-]{6,20}$/, "Enter a valid phone number"),
  address: z.string().trim().min(5, "Please enter your full address").max(500),
  quantity: z.number().int().min(1).max(1000),
});

export function CheckoutModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "" });
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(false);
      setQty(1);
      setForm({ customer_name: "", phone: "", address: "" });
    }, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const parsed = schema.safeParse({ ...form, quantity: qty });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("orders").insert({
      ...parsed.data,
      product_id: product.id,
      product_name: product.name,
      total_price: product.price * qty,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not place order. Please try again.");
      return;
    }
    setDone(true);
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        {product && done ? (
          <div className="flex flex-col items-center py-6 text-center animate-rise">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <h3 className="mt-4 text-2xl font-semibold">Order placed!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll call you at {form.phone} to confirm delivery of {qty} × {product.name}.
            </p>
            <Button className="mt-6 w-full" onClick={close}>Continue shopping</Button>
          </div>
        ) : product ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Checkout</DialogTitle>
              <DialogDescription>Cash on delivery. Fill in your details below.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-secondary-foreground">{product.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(product.price)} each</p>
              </div>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" maxLength={100} value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" inputMode="tel" maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Full address</Label>
                <Textarea id="address" rows={3} maxLength={500} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" size="icon" variant="outline" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center font-semibold">{qty}</span>
                  <Button type="button" size="icon" variant="outline" aria-label="Increase" onClick={() => setQty((q) => Math.min(1000, q + 1))}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-semibold text-primary">{formatPrice(product.price * qty)}</span>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} Place order
              </Button>
            </form>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
