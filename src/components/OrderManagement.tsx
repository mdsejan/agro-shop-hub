import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/products";

export const ORDER_STATUSES = ["pending", "processing", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  product_name: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
};

const statusStyle: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground border-accent/40",
  processing: "bg-primary/10 text-primary border-primary/30",
  delivered: "bg-primary text-primary-foreground border-primary",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const ordersQuery = {
  queryKey: ["admin-orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_name, phone, address, product_name, quantity, total_price, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Order[];
  },
};

export function OrderManagement() {
  const qc = useQueryClient();
  const { data: orders, isLoading, isError, error, refetch, isFetching } = useQuery(ordersQuery);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Order could not be updated");
    },
    onSuccess: (_d, v) => {
      toast.success(`Order marked ${label(v.status)}`);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const count = (s: "all" | OrderStatus) => (s === "all" ? orders?.length ?? 0 : orders?.filter((o) => o.status === s).length ?? 0);
  const shown = filter === "all" ? orders : orders?.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | OrderStatus)}>
          <TabsList className="h-auto flex-wrap">
            {(["all", ...ORDER_STATUSES] as const).map((s) => (
              <TabsTrigger key={s} value={s}>
                {label(s)} ({count(s)})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
      ) : isError ? (
        <p className="rounded-2xl bg-card p-6 text-sm text-destructive shadow-card">Couldn't load orders: {(error as Error).message}</p>
      ) : !shown?.length ? (
        <p className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground shadow-card">
          {filter === "all" ? "No orders yet." : `No ${filter} orders.`}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="min-w-[200px]">Address</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.customer_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{o.phone}</TableCell>
                  <TableCell className="whitespace-normal">{o.address}</TableCell>
                  <TableCell>{o.product_name}</TableCell>
                  <TableCell className="text-right">{o.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold text-primary">{formatPrice(o.total_price)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                  <TableCell>
                    <select
                      aria-label={`Status for order from ${o.customer_name}`}
                      value={o.status}
                      disabled={update.isPending && update.variables?.id === o.id}
                      onChange={(e) => update.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                      className={`h-8 rounded-full border px-3 text-xs font-semibold ${statusStyle[o.status] ?? "bg-muted"}`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-background text-foreground">
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
