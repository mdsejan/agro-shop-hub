import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  description: string | null;
};

export const CATEGORIES = ["Seeds", "Fertilizer", "Tools", "Equipment", "Irrigation"] as const;

export const formatPrice = (n: number) => `৳${Number(n).toLocaleString("en-US")}`;

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, image_url, category, description")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Product[];
  },
};
